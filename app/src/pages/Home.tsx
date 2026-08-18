import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, BarChart3, ClipboardCheck, ShieldCheck as ShieldIcon, Lightbulb, Building2, ExternalLink,
  RefreshCw, ShieldAlert, MessageCircle, Rocket,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { WhatsNewModal } from '@/components/shell/WhatsNewModal'

const QUICK_ACTIONS = [
  { icon: FileText, label: 'Quick Quote', to: '/quote/new' },
  { icon: BarChart3, label: 'Reports', to: '#' },
  { icon: ClipboardCheck, label: 'Proposals', to: '/leads?tab=proposals' },
  { icon: ShieldIcon, label: 'Policies', to: '/leads?tab=policies' },
  { icon: Lightbulb, label: 'Grow Pro', to: '#' },
  { icon: Building2, label: 'Search Hospitals', to: '#' },
  { icon: ExternalLink, label: 'User Control', to: '#' },
  { icon: RefreshCw, label: 'renewals', to: '#' },
  { icon: ShieldAlert, label: 'Claims', to: '#' },
]

export function Home() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'group' | 'retail' | 'unclassified'>('retail')
  const orderCandidates = useAppStore((s) => s.orderCandidates)
  const candidates = useMemo(() => Object.values(orderCandidates), [orderCandidates])
  const startConversation = useAppStore((s) => s.startConversation)
  const setActiveConversationId = useUiStore((s) => s.setActiveConversationId)

  const quotesCount = candidates.filter((c) => c.orderId && !c.proposalId).length
  const proposalsCount = candidates.filter((c) => c.proposalId && !c.policyId).length
  const policiesCount = candidates.filter((c) => c.policyId).length

  const openWhatsAppDemo = () => {
    const id = startConversation('Prakash Babu L')
    setActiveConversationId(id)
    navigate('/whatsapp')
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <WhatsNewModal />

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
          <p className="text-xs text-white/70">Explore the App</p>
          <p className="mt-1 text-2xl font-semibold">Discover key features for easy navigation</p>
          <button className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-700">Take a Tour</button>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-tara-500 to-tara-700 p-6 text-white">
          <p className="text-xs text-white/70">WhatsApp × TARA</p>
          <p className="mt-1 text-2xl font-semibold">Start a proposal on WhatsApp</p>
          <button onClick={openWhatsAppDemo} className="mt-4 flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-tara-700">
            <MessageCircle className="h-4 w-4" /> Know More
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold text-gray-900">Leads Summary</p>
          <button onClick={() => navigate('/leads')} className="text-sm font-medium text-brand-600">View All</button>
        </div>
        <div className="mb-5 flex w-fit gap-1 rounded-full bg-surface p-1 text-sm">
          {(['group', 'retail', 'unclassified'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 capitalize ${tab === t ? 'bg-white font-semibold text-gray-900 shadow-sm' : 'text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-500">Quote ({quotesCount})</p>
            <p className="text-2xl font-semibold text-gray-900">{quotesCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Policy ({policiesCount})</p>
            <p className="text-2xl font-semibold text-gray-900">{policiesCount}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Proposal ({proposalsCount})</p>
            <p className="text-2xl font-semibold text-gray-900">{proposalsCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-base font-semibold text-gray-900">Quick Actions</p>
          <button onClick={openWhatsAppDemo} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600">
            Start on WhatsApp with TARA
          </button>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {QUICK_ACTIONS.map(({ icon: Icon, label, to }) => (
            <button key={label} onClick={() => (to === '#' ? undefined : navigate(to))} className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 py-4 text-xs font-medium text-gray-600 hover:border-brand-200 hover:bg-brand-50">
              <Icon className="h-5 w-5 text-brand-600" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/quote/new')}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 py-4 text-sm font-semibold text-brand-700 hover:bg-brand-50"
      >
        <Rocket className="h-4 w-4" /> Or start the straight path: New Quick Quote in ATOM Pro
      </button>
    </div>
  )
}
