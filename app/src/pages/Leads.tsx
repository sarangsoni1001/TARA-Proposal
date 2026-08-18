import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, FileText } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { PRODUCTS } from '@/data/products'

type SubTab = 'quotes' | 'proposals' | 'policies'

export function Leads() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [group, setGroup] = useState<'group' | 'retail' | 'unclassified'>('retail')
  const [subTab, setSubTab] = useState<SubTab>((params.get('tab') as SubTab) || 'quotes')
  const orderCandidates = useAppStore((s) => s.orderCandidates)

  const buckets = useMemo(() => {
    const candidates = Object.values(orderCandidates).filter((c) => c.orderId)
    return {
      quotes: candidates.filter((c) => c.orderId && !c.proposalId),
      proposals: candidates.filter((c) => c.proposalId && !c.policyId),
      policies: candidates.filter((c) => c.policyId),
    }
  }, [orderCandidates])

  const list = buckets[subTab]

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-4 gap-6 p-6">
      <div className="col-span-3 rounded-2xl border border-gray-200 bg-white p-5">
        <h1 className="mb-4 text-lg font-semibold text-gray-900">Leads</h1>
        <div className="mb-4 flex gap-6 border-b border-gray-100 text-sm">
          {(['group', 'retail', 'unclassified'] as const).map((g) => (
            <button key={g} onClick={() => setGroup(g)} className={`-mb-px border-b-2 pb-2 capitalize ${group === g ? 'border-brand-700 font-semibold text-brand-800' : 'border-transparent text-gray-400'}`}>
              {g}
            </button>
          ))}
        </div>
        <div className="mb-5 flex gap-6 text-sm">
          {(['quotes', 'proposals', 'policies'] as const).map((t) => (
            <button key={t} onClick={() => setSubTab(t)} className={`flex items-center gap-1.5 capitalize ${subTab === t ? 'font-semibold text-brand-700' : 'text-gray-400'}`}>
              {t[0].toUpperCase() + t.slice(1)}
              {buckets[t].length > 0 && <span className="rounded-full bg-brand-100 px-1.5 text-xs text-brand-700">{buckets[t].length}</span>}
            </button>
          ))}
        </div>

        {group !== 'retail' ? (
          <p className="py-10 text-center text-sm text-gray-400">No {group} leads in this demo — try the Retail tab.</p>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">Nothing here yet. Start a Quick Quote or the WhatsApp demo.</p>
        ) : (
          <div className="space-y-3">
            {list.map((c) => {
              const prefilledCount = Object.values(c.fields).filter((f) => f?.source === 'whatsapp').length
              const cfg = c.product ? PRODUCTS[c.product.value] : null
              return (
                <div key={c.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                        {c.customerLabel.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-900">{c.customerLabel}</p>
                        <p className="text-xs text-gray-500">
                          {cfg?.name} · {cfg?.planLabel} · Order Id: {c.orderId}
                        </p>
                      </div>
                    </div>
                    {c.createdFromWhatsapp && (
                      <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                        <Sparkles className="h-3 w-3" /> Created by TARA
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {c.createdFromWhatsapp && <span className="rounded-full border border-gray-200 px-2.5 py-1 text-gray-600">WhatsApp · TARA</span>}
                    <span className="rounded-full border border-gray-200 px-2.5 py-1 text-gray-600">
                      {String(c.fields.numAdults?.value ?? 1)} Adults + {String(c.fields.numChildren?.value ?? 0)} Child
                    </span>
                    {c.fields.sumInsured && <span className="rounded-full border border-gray-200 px-2.5 py-1 text-gray-600">₹{(Number(c.fields.sumInsured.value) / 100000).toFixed(0)} Lakh</span>}
                    {prefilledCount > 0 && <span className="rounded-full border border-gray-200 px-2.5 py-1 text-gray-600">{prefilledCount} fields prefilled</span>}
                  </div>

                  {c.documents.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-brand-600">
                      {c.documents.map((d) => (
                        <span key={d.id} className="flex items-center gap-1"><FileText className="h-3 w-3" /> {d.fileName}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm">
                      <span className="text-gray-400">Premium ·</span> <span className="font-semibold text-gray-900">₹{(c.premium ?? 0).toLocaleString('en-IN')}</span>
                    </p>
                    <button
                      onClick={() => navigate(subTab === 'policies' ? `/checkout/${c.id}` : subTab === 'proposals' ? `/checkout/${c.id}` : `/proposal/${c.id}`)}
                      className="rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
                    >
                      {subTab === 'quotes' ? 'Fill proposal →' : subTab === 'proposals' ? 'Continue to payment →' : 'View policy →'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-gray-900">Filters</p>
        <div className="space-y-2">
          {['Current Status', 'Last 7 days', 'Payment Status'].map((f) => (
            <button key={f} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-xs text-gray-600">
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
