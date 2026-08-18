import { describe, expect, it } from 'vitest'
import {
  computeMissingFields,
  decideTaraReply,
  findDuplicateCustomer,
  reconcileValidationFlags,
  runValidations,
} from './orchestrator'
import type { ExtractedField, FieldValues, OrderCandidate, ValidationFlag } from '@/types'

function field<T>(value: T, status: ExtractedField['status'] = 'suggested'): ExtractedField<T> {
  return { value, source: 'whatsapp', sourceDetail: 'test', confidence: 0.9, status, extractedAt: new Date().toISOString() }
}

function baseCandidate(overrides: Partial<OrderCandidate> = {}): OrderCandidate {
  return {
    id: 'ORDC-TEST',
    conversationId: 'CONV-TEST',
    customerLabel: 'Rajesh Kumar',
    product: null,
    fields: {},
    members: [],
    documents: [],
    ambiguities: [],
    validationFlags: [],
    missingFields: [],
    stage: 'COLLECTING_INFORMATION',
    createdFromWhatsapp: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    audit: [],
    ...overrides,
  }
}

describe('computeMissingFields', () => {
  it('falls back to name + mobile when the product is not yet known', () => {
    const c = baseCandidate()
    expect(computeMissingFields(c)).toEqual(['fullName', 'mobile'])
  })

  it('uses the product config once a product is set', () => {
    const c = baseCandidate({ product: field('SUPERSTAR' as const, 'verified') })
    const missing = computeMissingFields(c)
    expect(missing).toContain('dob')
    expect(missing).toContain('nomineeName')
  })

  it('does not list a field as missing once it is accepted', () => {
    const c = baseCandidate({
      product: field('SUPERSTAR' as const, 'verified'),
      fields: { fullName: field('Rajesh Kumar', 'accepted') } as FieldValues,
    })
    expect(computeMissingFields(c)).not.toContain('fullName')
  })
})

describe('runValidations — age vs DOB mismatch (scenario 9)', () => {
  it('flags a mismatch when the stated age disagrees with the DOB on file', () => {
    const c = baseCandidate({ fields: { age: field(42), dob: field('15/03/1970') } as FieldValues })
    const flags = runValidations(c)
    expect(flags.some((f) => f.field === 'dob' && f.severity === 'blocking')).toBe(true)
  })

  it('does not flag when age and DOB roughly agree', () => {
    const currentYear = new Date().getFullYear()
    const dob = `01/01/${currentYear - 42}`
    const c = baseCandidate({ fields: { age: field(42), dob: field(dob) } as FieldValues })
    expect(runValidations(c).some((f) => f.field === 'dob')).toBe(false)
  })
})

describe('runValidations — mobile and pincode', () => {
  it('flags an invalid mobile number as blocking', () => {
    const c = baseCandidate({ fields: { mobile: field('12345') } as FieldValues })
    const flags = runValidations(c)
    expect(flags.find((f) => f.field === 'mobile')?.severity).toBe('blocking')
  })

  it('flags an invalid pincode as a warning, not blocking', () => {
    const c = baseCandidate({ fields: { pincode: field('12A') } as FieldValues })
    const flags = runValidations(c)
    expect(flags.find((f) => f.field === 'pincode')?.severity).toBe('warning')
  })

  it('does not flag a valid 10-digit mobile starting 6-9', () => {
    const c = baseCandidate({ fields: { mobile: field('9876543210') } as FieldValues })
    expect(runValidations(c)).toHaveLength(0)
  })
})

describe('reconcileValidationFlags — corrections retire stale warnings (regression)', () => {
  it('drops the old mismatch message once a fresh, consistent one replaces it', () => {
    const existing: ValidationFlag[] = [
      { id: 'FLAG-1', field: 'dob', severity: 'blocking', message: 'stated age (42) ... implies age 56', createdAt: '', resolved: false },
    ]
    const fresh: ValidationFlag[] = [
      { id: 'FLAG-2', field: 'dob', severity: 'blocking', message: 'stated age (45) ... implies age 56', createdAt: '', resolved: false },
    ]
    const result = reconcileValidationFlags(existing, fresh)
    const active = result.filter((f) => !f.resolved)
    expect(active).toHaveLength(1)
    expect(active[0].message).toContain('45')
  })

  it('resolves a flag whose field is no longer problematic instead of leaving it stuck forever', () => {
    const existing: ValidationFlag[] = [
      { id: 'FLAG-1', field: 'mobile', severity: 'blocking', message: 'invalid mobile', createdAt: '', resolved: false },
    ]
    const result = reconcileValidationFlags(existing, [])
    expect(result).toHaveLength(1)
    expect(result[0].resolved).toBe(true)
  })

  it('never produces two simultaneously-active flags for the same field', () => {
    const existing: ValidationFlag[] = [
      { id: 'FLAG-1', field: 'pincode', severity: 'warning', message: 'old', createdAt: '', resolved: false },
    ]
    const fresh: ValidationFlag[] = [
      { id: 'FLAG-2', field: 'pincode', severity: 'warning', message: 'new', createdAt: '', resolved: false },
    ]
    const result = reconcileValidationFlags(existing, fresh)
    expect(result.filter((f) => !f.resolved && f.field === 'pincode')).toHaveLength(1)
  })
})

describe('findDuplicateCustomer', () => {
  it('flags a duplicate when another active order shares the same mobile number', () => {
    const existing = baseCandidate({ id: 'ORDC-1', stage: 'QUOTE_CREATED', fields: { mobile: field('9876543210') } as FieldValues })
    const incoming = baseCandidate({ id: 'ORDC-2', fields: { mobile: field('9876543210') } as FieldValues })
    expect(findDuplicateCustomer(incoming, [existing, incoming])?.id).toBe('ORDC-1')
  })

  it('does not flag against another candidate that is still only collecting information', () => {
    const stillCollecting = baseCandidate({ id: 'ORDC-1', stage: 'COLLECTING_INFORMATION', fields: { mobile: field('9876543210') } as FieldValues })
    const incoming = baseCandidate({ id: 'ORDC-2', fields: { mobile: field('9876543210') } as FieldValues })
    expect(findDuplicateCustomer(incoming, [stillCollecting, incoming])).toBeUndefined()
  })
})

describe('decideTaraReply', () => {
  it('surfaces a blocking validation flag before anything else', () => {
    const c = baseCandidate({
      product: field('SUPERSTAR' as const, 'verified'),
      validationFlags: [{ id: 'F1', field: 'mobile', severity: 'blocking', message: 'bad mobile', createdAt: '', resolved: false }],
    })
    expect(decideTaraReply(c).replies[0]).toBe('bad mobile')
  })

  it('asks for one missing field at a time rather than dumping the whole list', () => {
    const c = baseCandidate({ product: field('SUPERSTAR' as const, 'verified') })
    const result = decideTaraReply(c)
    expect(result.replies).toHaveLength(1)
    expect(result.readyForOrder).toBe(false)
  })

  it('offers the Create Order card once every required field is present', () => {
    const allFields = ['fullName', 'dob', 'mobile', 'email', 'addressLine1', 'pincode', 'occupation', 'annualIncome', 'accountHolderName', 'accountNumber', 'ifsc', 'bankName', 'nomineeName', 'nomineeRelationship'] as const
    const fields = Object.fromEntries(allFields.map((f) => [f, field('x', 'accepted')])) as FieldValues
    const c = baseCandidate({ product: field('SUPERSTAR' as const, 'verified'), fields })
    const result = decideTaraReply(c)
    expect(result.readyForOrder).toBe(true)
    expect(result.cardOptions?.map((o) => o.value)).toContain('CREATE_ORDER')
  })
})
