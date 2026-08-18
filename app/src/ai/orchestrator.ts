import { PRODUCTS, estimatePremium } from '@/data/products'
import { nowIso } from '@/lib/ids'
import type {
  Ambiguity,
  ExtractedCustomer,
  FieldName,
  FieldValues,
  OrderCandidate,
  ValidationFlag,
} from '@/types'

/**
 * The deterministic business layer (PROMPT.md section 15): takes the AI
 * layer's structured output and decides what happens to order-candidate
 * state. The AI module never touches this state directly — it only ever
 * returns data, and everything here is plain, testable functions with no
 * store/React dependency.
 */

export const FIELD_LABELS: Record<FieldName, string> = {
  title: 'title',
  fullName: "customer's name",
  dob: 'date of birth',
  age: 'age',
  mobile: 'mobile number',
  email: 'email address',
  city: 'city',
  pincode: 'pincode',
  addressLine1: 'address',
  addressLine2: 'address line 2',
  occupation: 'occupation',
  annualIncome: 'annual income',
  panAvailable: 'PAN availability',
  accountHolderName: 'name on bank account',
  accountNumber: 'bank account number',
  ifsc: 'IFSC code',
  bankName: 'bank name',
  nomineeName: 'nominee details',
  nomineeRelationship: 'nominee relationship',
  sumInsured: 'sum insured',
  policyTenureYears: 'policy period',
  numAdults: 'number of adults to insure',
  numChildren: 'number of children to insure',
}

function setField(fields: FieldValues, name: FieldName, value: unknown, sourceDetail: string, confidence: number): FieldValues {
  const existing = fields[name]
  // Never silently downgrade an agent-verified/accepted field with a lower-confidence guess,
  // unless the new message reads as an explicit correction (caller marks that via sourceDetail).
  if (existing && (existing.status === 'accepted' || existing.status === 'verified') && !sourceDetail.startsWith('correction:')) {
    if (confidence <= existing.confidence) return fields
  }
  return {
    ...fields,
    [name]: {
      value,
      source: 'whatsapp',
      sourceDetail: sourceDetail.replace(/^correction:/, ''),
      confidence,
      status: 'suggested',
      extractedAt: nowIso(),
    },
  }
}

export function mergeExtractedCustomerIntoCandidate(
  candidate: OrderCandidate,
  extracted: ExtractedCustomer,
  sourceDetail: string,
  isCorrection: boolean,
): OrderCandidate {
  let fields = { ...candidate.fields }
  const prefix = isCorrection ? 'correction:' : ''
  const put = (name: FieldName, value: unknown, confidence = extracted.confidence) => {
    if (value === undefined || value === null || value === '') return
    fields = setField(fields, name, value, `${prefix}${sourceDetail}`, confidence)
  }

  put('fullName', extracted.name)
  put('dob', extracted.dob)
  put('age', extracted.age)
  put('mobile', extracted.mobile)
  put('email', extracted.email)
  put('city', extracted.city)
  put('pincode', extracted.pincode)
  put('occupation', extracted.occupation)
  put('annualIncome', extracted.annualIncome)
  put('nomineeName', extracted.nomineeName)
  put('nomineeRelationship', extracted.nomineeRelationship)
  if (extracted.numAdults) put('numAdults', extracted.numAdults)
  if (extracted.numChildren !== undefined) put('numChildren', extracted.numChildren)

  const customerLabel = (fields.fullName?.value as string) || candidate.customerLabel

  return {
    ...candidate,
    fields,
    customerLabel,
    updatedAt: nowIso(),
  }
}

export function computeMissingFields(candidate: OrderCandidate): FieldName[] {
  const productCode = candidate.product?.value
  const required: FieldName[] = productCode ? PRODUCTS[productCode].requiredFields : ['fullName', 'mobile']
  return required.filter((f) => {
    const field = candidate.fields[f]
    return !field || field.status === 'rejected'
  })
}

function parseDdMmYyyy(dob: string): Date | null {
  const m = dob.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (!m) return null
  let [, d, mo, y] = m
  if (y.length === 2) y = `20${y}`
  const date = new Date(Number(y), Number(mo) - 1, Number(d))
  return Number.isNaN(date.getTime()) ? null : date
}

function ageFromDob(dob: string): number | null {
  const date = parseDdMmYyyy(dob)
  if (!date) return null
  const diffMs = Date.now() - date.getTime()
  return Math.floor(diffMs / (365.25 * 24 * 3600 * 1000))
}

/**
 * Recomputes the CURRENT, complete set of active validation issues from scratch — it is not
 * a delta. Callers reconcile this against `candidate.validationFlags` (see `reconcileValidationFlags`)
 * so a flag automatically clears once the underlying fields no longer justify it, e.g. the agent
 * supplying a corrected age must retire the old "age vs DOB mismatch" warning, not leave it stuck.
 */
export function runValidations(candidate: OrderCandidate): ValidationFlag[] {
  const flags: ValidationFlag[] = []
  const push = (field: ValidationFlag['field'], severity: ValidationFlag['severity'], message: string) => {
    flags.push({ id: `FLAG-${Math.random().toString(36).slice(2, 9)}`, field, severity, message, createdAt: nowIso(), resolved: false })
  }

  const ageField = candidate.fields.age
  const dobField = candidate.fields.dob
  if (ageField && dobField) {
    const derivedAge = ageFromDob(String(dobField.value))
    if (derivedAge !== null && Math.abs(derivedAge - Number(ageField.value)) > 1) {
      push('dob', 'blocking', `I found a mismatch between the stated age (${ageField.value}) and the date of birth on file (implies age ${derivedAge}). Please verify before continuing.`)
    }
  }

  const mobileField = candidate.fields.mobile
  if (mobileField && !/^[6-9]\d{9}$/.test(String(mobileField.value))) {
    push('mobile', 'blocking', 'The mobile number appears to be incomplete or invalid. Please verify it.')
  }

  const pincodeField = candidate.fields.pincode
  if (pincodeField && !/^\d{6}$/.test(String(pincodeField.value))) {
    push('pincode', 'warning', 'The pincode appears to be invalid. Please check it.')
  }

  return flags
}

/** Merges a fresh `runValidations` pass into the candidate's flag history: retires flags whose
 * field is no longer problematic, and replaces (rather than duplicates) still-active ones. */
export function reconcileValidationFlags(existing: ValidationFlag[], fresh: ValidationFlag[]): ValidationFlag[] {
  const activeFields = new Set(fresh.map((f) => f.field))
  const carried = existing
    .map((f) => {
      if (f.resolved) return f // history — keep as-is
      if (activeFields.has(f.field)) return null // superseded by a fresh flag for the same field, drop
      return { ...f, resolved: true } // no longer an issue — retire it
    })
    .filter((f): f is ValidationFlag => f !== null)
  return [...carried, ...fresh]
}

export function findDuplicateCustomer(candidate: OrderCandidate, allCandidates: OrderCandidate[]): OrderCandidate | undefined {
  const mobile = candidate.fields.mobile?.value
  const name = candidate.fields.fullName?.value
  if (!mobile && !name) return undefined
  return allCandidates.find((other) => {
    if (other.id === candidate.id) return false
    if (other.stage === 'COLLECTING_INFORMATION') return false // not yet a real order
    const sameMobile = mobile && other.fields.mobile?.value === mobile
    const sameName = name && other.fields.fullName?.value === name
    return Boolean(sameMobile || sameName)
  })
}

export function buildAmbiguity(kind: Ambiguity['kind'], description: string, candidateCustomerIds: string[], relatedDocumentId?: string): Ambiguity {
  return {
    id: `AMB-${Math.random().toString(36).slice(2, 9)}`,
    kind,
    description,
    candidateCustomerIds,
    relatedDocumentId,
    resolved: false,
  }
}

export interface TaraTurnResult {
  replies: string[]
  cardOptions?: { label: string; value: string }[]
  readyForOrder: boolean
}

/** Decides what TARA says next for one order candidate — progressive disclosure, never a 15-question dump. */
export function decideTaraReply(candidate: OrderCandidate): TaraTurnResult {
  const blockingFlag = candidate.validationFlags.find((f) => !f.resolved && f.severity === 'blocking')
  if (blockingFlag) {
    return { replies: [blockingFlag.message], readyForOrder: false }
  }

  const unresolvedAmbiguity = candidate.ambiguities.find((a) => !a.resolved)
  if (unresolvedAmbiguity) {
    return { replies: [unresolvedAmbiguity.description], readyForOrder: false }
  }

  if (!candidate.product) {
    return { replies: [`Which plan should I use for ${candidate.customerLabel !== 'New customer' ? candidate.customerLabel : 'this customer'} — Superstar or Assure?`], readyForOrder: false }
  }

  const missing = computeMissingFields(candidate)
  if (missing.length > 0) {
    const next = missing[0]
    return { replies: [`Thanks — I still need ${FIELD_LABELS[next]} for ${candidate.customerLabel}. Please share it in any format.`], readyForOrder: false }
  }

  return {
    replies: [`I have everything I need for ${candidate.customerLabel}'s ${PRODUCTS[candidate.product.value].name} proposal. Shall I create the order?`],
    cardOptions: [
      { label: 'Create Order', value: 'CREATE_ORDER' },
      { label: 'Review Details', value: 'REVIEW_DETAILS' },
      { label: 'Add Information', value: 'ADD_INFO' },
    ],
    readyForOrder: true,
  }
}

export function computePremium(candidate: OrderCandidate): number {
  if (!candidate.product) return 0
  const sumInsured = Number(candidate.fields.sumInsured?.value) || PRODUCTS[candidate.product.value].sumInsuredOptions[1]
  const tenure = Number(candidate.fields.policyTenureYears?.value) || 1
  return estimatePremium(candidate.product.value, sumInsured, tenure)
}
