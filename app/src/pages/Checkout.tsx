import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { CheckCircle2, PartyPopper } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { PRODUCTS } from '@/data/products'
import { TaraSuggestsBanner } from '@/components/shared/TaraSuggestsBanner'

export function Checkout() {
  const { candidateId = '' } = useParams()
  const navigate = useNavigate()
  const candidate = useAppStore((s) => s.orderCandidates[candidateId])
  const pay = useAppStore((s) => s.pay)
  const [accepted, setAccepted] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [method, setMethod] = useState('Online')

  if (!candidate) {
    return (
      <div className="p-10 text-center text-sm text-gray-500">
        Order candidate not found. <Link to="/leads" className="text-brand-600">Back to Leads</Link>
      </div>
    )
  }

  const cfg = candidate.product ? PRODUCTS[candidate.product.value] : null
  const sumInsured = Number(candidate.fields.sumInsured?.value) || 0
  const tenure = Number(candidate.fields.policyTenureYears?.value) || 1
  const premium = candidate.premium ?? 0

  const onPay = () => {
    setProcessing(true)
    setTimeout(() => {
      pay(candidateId, method)
      setProcessing(false)
    }, 900)
  }

  if (candidate.stage === 'POLICY_CONVERTED') {
    const policy = useAppStore.getState().policies[candidate.policyId ?? '']
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <PartyPopper className="mx-auto mb-4 h-10 w-10 text-emerald-500" />
        <h1 className="text-xl font-semibold text-gray-900">Policy issued!</h1>
        <p className="mt-2 text-sm text-gray-500">
          {cfg?.name} for {candidate.customerLabel} is now active.
        </p>
        <div className="mt-5 space-y-1 rounded-xl border border-gray-200 bg-white p-4 text-left text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Policy No.</span><span className="font-medium">{policy?.policyNumber}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Sum Insured</span><span className="font-medium">₹{(sumInsured / 100000).toFixed(0)} Lakh</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Premium</span><span className="font-medium">₹{premium.toLocaleString('en-IN')}</span></div>
        </div>
        <button onClick={() => navigate('/leads')} className="mt-6 w-full rounded-lg bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-800">
          Go to Master Leads → Policies
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-3 gap-6 p-6">
      <div className="col-span-2 space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs text-gray-400">Review › <span className="font-semibold text-gray-700">Checkout</span></p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{cfg?.name}</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-gray-200 p-3"><p className="text-gray-500">Sum Insured</p><p className="font-semibold">₹{(sumInsured / 100000).toFixed(0)} Lakh</p></div>
            <div className="rounded-lg border border-gray-200 p-3"><p className="text-gray-500">Policy Period</p><p className="font-semibold">{tenure} Year(s)</p></div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Additional Covers</p>
          <TaraSuggestsBanner title="Adding Health Booster now costs less than upgrading later" detail="Consumables and Health Booster are the most opted covers for families in your pincode." />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Payment Preference</p>
          <div className="mb-3 flex gap-2">
            {['Online', 'Cash/Cheque', 'Block and Pay via Bima-ASBA'].map((m) => (
              <button key={m} onClick={() => setMethod(m)} className={`rounded-lg border px-3 py-2 text-xs font-medium ${method === m ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}>
                {m}
              </button>
            ))}
          </div>
          <TaraSuggestsBanner title="Online is the fastest mode — most policies issue within 2 minutes" detail="Payment link can be shared with the customer if they prefer to pay themselves." />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Premium Breakup</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Total Premium</span><span className="font-semibold text-gray-900">₹{premium.toLocaleString('en-IN')}</span></div>
          </div>
          <label className="mt-4 flex items-start gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
            I hereby declare that all information provided above is true, and I accept all Terms and Conditions
          </label>
          {!accepted && <p className="mt-1 text-xs text-rose-500">Kindly accept the Terms &amp; Conditions to proceed</p>}
          <button
            disabled={!accepted || processing}
            onClick={onPay}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-3 text-sm font-semibold text-white enabled:hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {processing ? 'Processing…' : <><CheckCircle2 className="h-4 w-4" /> Pay Now</>}
          </button>
        </div>
      </div>
    </div>
  )
}
