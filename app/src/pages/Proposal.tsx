import { useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { FieldWithPrefill } from '@/components/shared/FieldWithPrefill'
import { TaraWarningBanner } from '@/components/shared/TaraWarningBanner'
import { DocumentsPanel } from '@/components/shared/DocumentsPanel'

const PROPOSER_STEPS = [
  { id: 'kyc', label: 'KYC' },
  { id: 'basic', label: 'Basic' },
  { id: 'disclosures', label: 'Disclosures' },
  { id: 'address', label: 'Address' },
  { id: 'bank', label: 'Bank' },
] as const

const INSURED_STEPS = [
  { id: 'members', label: 'Members' },
  { id: 'nominee', label: 'Nominee' },
  { id: 'medical', label: 'Medical' },
  { id: 'files', label: 'Files' },
] as const

type StepId = (typeof PROPOSER_STEPS)[number]['id'] | (typeof INSURED_STEPS)[number]['id']

export function Proposal() {
  const { candidateId = '' } = useParams()
  const navigate = useNavigate()
  const candidate = useAppStore((s) => s.orderCandidates[candidateId])
  const [phase, setPhase] = useState<'proposer' | 'insured'>('proposer')
  const [stepId, setStepId] = useState<StepId>('kyc')

  const steps = phase === 'proposer' ? PROPOSER_STEPS : INSURED_STEPS
  const stepIndex = steps.findIndex((s) => s.id === stepId)

  const fieldsForStep = useMemo(() => {
    if (!candidate) return []
    const flags = candidate.validationFlags.filter((f) => !f.resolved)
    return flags
  }, [candidate])

  if (!candidate) {
    return (
      <div className="p-10 text-center text-sm text-gray-500">
        Order candidate not found. <Link to="/leads" className="text-brand-600">Back to Leads</Link>
      </div>
    )
  }

  const goNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepId(steps[stepIndex + 1].id)
      return
    }
    if (phase === 'proposer') {
      setPhase('insured')
      setStepId('members')
      return
    }
    navigate(`/checkout/${candidateId}`)
  }

  const goBack = () => {
    if (stepIndex > 0) {
      setStepId(steps[stepIndex - 1].id)
      return
    }
    if (phase === 'insured') {
      setPhase('proposer')
      setStepId('bank')
    }
  }

  const relevantFlags = fieldsForStep.filter((f) => {
    if (stepId === 'address') return f.field === 'pincode' || f.field === 'addressLine1'
    if (stepId === 'basic') return f.field === 'mobile' || f.field === 'dob' || f.field === 'fullName'
    return false
  })

  return (
    <div className="mx-auto max-w-4xl p-6">
      <button onClick={() => navigate('/leads')} className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex items-center justify-center gap-10">
        {(['Plan', 'Proposer', 'Insured'] as const).map((label, i) => {
          const done = (label === 'Plan') || (label === 'Proposer' && phase === 'insured')
          const active = (label === 'Proposer' && phase === 'proposer') || (label === 'Insured' && phase === 'insured')
          return (
            <div key={label} className="flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${done ? 'bg-brand-700 text-white' : active ? 'border-2 border-brand-700 text-brand-700' : 'border border-gray-300 text-gray-400'}`}>
                {done ? '✓' : i + 1}
              </span>
              <span className={`text-sm font-medium ${active || done ? 'text-brand-800' : 'text-gray-400'}`}>{label}</span>
            </div>
          )
        })}
      </div>
      <div className="mb-6 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        {steps.map((s, i) => (
          <span key={s.id} className={i === stepIndex ? 'font-semibold text-brand-700' : ''}>
            {s.label}
            {i < steps.length - 1 && <span className="mx-1.5">›</span>}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="mb-4 text-base font-semibold text-gray-900">
          {candidate.customerLabel} — {phase === 'proposer' ? 'Proposer' : 'Insured'} · {steps[stepIndex].label}
        </p>

        {relevantFlags.map((f) => (
          <div key={f.id} className="mb-4">
            <TaraWarningBanner message={f.message} blocking={f.severity === 'blocking'} />
          </div>
        ))}

        {stepId === 'kyc' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Identity verification for the proposer.</p>
            <FieldWithPrefill candidateId={candidateId} field="panAvailable" label="Do you have a PAN number?" placeholder="Yes / No" required={false} />
          </div>
        )}

        {stepId === 'basic' && (
          <div className="grid grid-cols-2 gap-4">
            <FieldWithPrefill candidateId={candidateId} field="title" label="Title" placeholder="Mr." required={false} />
            <FieldWithPrefill candidateId={candidateId} field="fullName" label="Full Name as per ID Proof" placeholder="Full name" />
            <FieldWithPrefill candidateId={candidateId} field="dob" label="Date of Birth" placeholder="DD/MM/YYYY" />
            <FieldWithPrefill candidateId={candidateId} field="mobile" label="Phone Number" placeholder="10-digit mobile" />
            <FieldWithPrefill candidateId={candidateId} field="email" label="Email Id" placeholder="name@example.com" />
          </div>
        )}

        {stepId === 'disclosures' && (
          <div className="grid grid-cols-2 gap-4">
            <FieldWithPrefill candidateId={candidateId} field="occupation" label="Occupation" placeholder="Business/Traders, Professional…" />
            <FieldWithPrefill candidateId={candidateId} field="annualIncome" label="Annual Income (₹)" type="number" placeholder="0" />
          </div>
        )}

        {stepId === 'address' && (
          <div className="grid grid-cols-2 gap-4">
            <FieldWithPrefill candidateId={candidateId} field="addressLine1" label="Address Line 1" placeholder="House / street" />
            <FieldWithPrefill candidateId={candidateId} field="city" label="City" placeholder="City" required={false} />
            <FieldWithPrefill candidateId={candidateId} field="pincode" label="PIN Code" placeholder="6-digit pincode" />
          </div>
        )}

        {stepId === 'bank' && (
          <div className="grid grid-cols-2 gap-4">
            <FieldWithPrefill candidateId={candidateId} field="accountHolderName" label="Name on Bank Account" placeholder="As per bank records" />
            <FieldWithPrefill candidateId={candidateId} field="accountNumber" label="Account Number" placeholder="Account number" />
            <FieldWithPrefill candidateId={candidateId} field="ifsc" label="IFSC" placeholder="e.g. HDFC0000123" />
            <FieldWithPrefill candidateId={candidateId} field="bankName" label="Bank Name" placeholder="Bank name" />
          </div>
        )}

        {stepId === 'members' && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-gray-500">Adults</p>
              <p className="text-lg font-semibold text-gray-900">{String(candidate.fields.numAdults?.value ?? 1)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <p className="text-gray-500">Children</p>
              <p className="text-lg font-semibold text-gray-900">{String(candidate.fields.numChildren?.value ?? 0)}</p>
            </div>
          </div>
        )}

        {stepId === 'nominee' && (
          <div className="grid grid-cols-2 gap-4">
            <FieldWithPrefill candidateId={candidateId} field="nomineeName" label="Nominee Name" placeholder="Full name" />
            <FieldWithPrefill candidateId={candidateId} field="nomineeRelationship" label="Relationship with proposer" placeholder="e.g. Spouse" />
          </div>
        )}

        {stepId === 'medical' && (
          <div className="space-y-3 text-sm">
            <p className="font-medium text-gray-800">Do you or anyone in your family have any Pre-Existing Disease?</p>
            <div className="flex gap-4 text-gray-600">
              <label className="flex items-center gap-1.5"><input type="radio" name="ped" defaultChecked /> No</label>
              <label className="flex items-center gap-1.5"><input type="radio" name="ped" /> Yes</label>
            </div>
          </div>
        )}

        {stepId === 'files' && <DocumentsPanel candidateId={candidateId} />}

        <p className="mt-6 text-xs text-brand-500">👍 Your lead is 100% secured with us.</p>

        <div className="mt-4 flex justify-between">
          <button onClick={goBack} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600">
            Back
          </button>
          <button onClick={goNext} className="rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800">
            {phase === 'insured' && stepIndex === steps.length - 1 ? 'Review & Checkout' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
