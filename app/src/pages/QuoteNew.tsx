import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { PRODUCTS, estimatePremium } from '@/data/products'
import { TaraSuggestsBanner } from '@/components/shared/TaraSuggestsBanner'
import type { ProductCode } from '@/types'

export function QuoteNew() {
  const navigate = useNavigate()
  const createManualCandidate = useAppStore((s) => s.createManualCandidate)
  const setProduct = useAppStore((s) => s.setProduct)
  const updateField = useAppStore((s) => s.updateField)
  const createOrderAndQuote = useAppStore((s) => s.createOrderAndQuote)
  const createProposal = useAppStore((s) => s.createProposal)

  const [step, setStep] = useState<'get-quote' | 'plan'>('get-quote')
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [pincode, setPincode] = useState('')
  const [product, setLocalProduct] = useState<ProductCode>('SUPERSTAR')
  const [numAdults, setNumAdults] = useState(1)
  const [numChildren, setNumChildren] = useState(0)
  const [sumInsured, setSumInsured] = useState(1000000)
  const [tenure, setTenure] = useState(1)

  const cfg = PRODUCTS[product]
  const premium = estimatePremium(product, sumInsured, tenure)

  const startPlan = () => {
    const id = createManualCandidate(null)
    setCandidateId(id)
    setStep('plan')
  }

  const createProposalNow = () => {
    if (!candidateId) return
    setProduct(candidateId, product)
    updateField(candidateId, 'numAdults', numAdults)
    updateField(candidateId, 'numChildren', numChildren)
    createOrderAndQuote(candidateId, sumInsured, tenure)
    createProposal(candidateId)
    navigate(`/proposal/${candidateId}`)
  }

  if (step === 'get-quote') {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 p-10">
        <h1 className="text-lg font-semibold text-gray-900">Get Your Quote</h1>
        <p className="text-sm text-gray-500">Please select the policy and enter pincode to proceed</p>

        <label className="text-xs font-medium text-brand-700">Intermediary</label>
        <select className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm">
          <option>M/S.BANK OF BARODA</option>
        </select>

        <TaraSuggestsBanner title="Ensure you are selecting a valid and active SP" />

        <div className="flex gap-2">
          <button className="flex-1 rounded-lg border border-brand-600 bg-brand-50 py-2.5 text-sm font-semibold text-brand-700">Retail</button>
          <button className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-600">Group</button>
        </div>

        <label className="text-xs font-medium text-brand-700">Pincode*</label>
        <input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="400081" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />

        <button
          disabled={pincode.length !== 6}
          onClick={startPlan}
          className="mt-2 rounded-lg bg-brand-300 py-3 text-sm font-semibold text-white enabled:bg-brand-700 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-3 gap-6 p-6">
      <div className="col-span-2 space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Select Product</p>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(PRODUCTS) as ProductCode[]).map((code) => (
              <button
                key={code}
                onClick={() => setLocalProduct(code)}
                className={`rounded-xl border p-4 text-left ${product === code ? 'border-brand-600 bg-brand-50' : 'border-gray-200'}`}
              >
                <p className="font-semibold text-gray-900">{PRODUCTS[code].name}</p>
                <p className="text-xs text-gray-500">{PRODUCTS[code].tagline}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-1 text-sm font-semibold text-gray-900">Basic Details</p>
          <p className="mb-4 text-xs text-gray-500">Select member(s) to insure</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-sm font-semibold">Number of Adults</p>
              <p className="mb-2 text-xs text-gray-400">18 years - 100 years</p>
              <select value={numAdults} onChange={(e) => setNumAdults(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                {[1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="rounded-xl border border-gray-200 p-3">
              <p className="text-sm font-semibold">Number of Children</p>
              <p className="mb-2 text-xs text-gray-400">91 days - 25 years</p>
              <select value={numChildren} onChange={(e) => setNumChildren(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm">
                {[0, 1, 2].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Sum Insured</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {cfg.sumInsuredOptions.map((amt) => (
              <button
                key={amt}
                onClick={() => setSumInsured(amt)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${sumInsured === amt ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'}`}
              >
                {amt / 100000} Lakh
              </button>
            ))}
          </div>
          <TaraSuggestsBanner title={`Recommended Sum Insured for this profile: ${cfg.sumInsuredOptions[Math.min(2, cfg.sumInsuredOptions.length - 1)] / 100000} Lakh`} detail="Considering medical inflation, a higher sum insured is recommended." />

          <p className="mt-4 mb-3 text-sm font-semibold text-gray-900">Policy Period</p>
          <div className="flex flex-wrap gap-2">
            {cfg.tenureOptions.map((t) => (
              <button
                key={t.years}
                onClick={() => setTenure(t.years)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${tenure === t.years ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <span className="text-emerald-600">✓</span> {cfg.builtInCovers.length} Built-In Covers Included
          </p>
          <div className="flex flex-wrap gap-2">
            {cfg.builtInCovers.map((c) => (
              <span key={c} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-900">Premium Breakup</p>
          <div className="mb-3 rounded-lg bg-brand-50 p-3">
            <p className="font-semibold text-gray-900">{cfg.name}</p>
            <p className="text-xs text-gray-500">{cfg.planLabel}</p>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500"><span>Sum Insured</span><span className="text-gray-800">₹{(sumInsured / 100000).toFixed(0)} Lakh</span></div>
            <div className="flex justify-between text-gray-500"><span>Policy Period</span><span className="text-gray-800">{tenure} Year(s)</span></div>
            <div className="my-2 border-t border-dashed border-gray-200" />
            <div className="flex justify-between text-base font-semibold text-gray-900"><span>Total Premium</span><span>₹{premium.toLocaleString('en-IN')}</span></div>
          </div>
          <button onClick={createProposalNow} className="mt-4 w-full rounded-lg bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-800">
            Create Proposal
          </button>
        </div>
      </div>
    </div>
  )
}
