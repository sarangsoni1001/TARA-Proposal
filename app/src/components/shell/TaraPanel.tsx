import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Bell, Smartphone, Maximize2, X, MessageSquare, ClipboardList, LifeBuoy, Send, RefreshCw, HeartPulse, Building2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'

const QUICK_ACTIONS = [
  { icon: RefreshCw, label: 'Generate Pitch' },
  { icon: Sparkles, label: 'Benefits of Super Star' },
  { icon: Building2, label: 'Network Hospitals near you' },
  { icon: HeartPulse, label: 'Medical Inflation in your area' },
]

const FAQS = [
  "Branch Details won't accept my branch",
  'SP code shows invalid',
  'The screen shows "Something went wrong!"',
  'My session keeps logging me out',
]

export function TaraPanel() {
  const isOpen = useUiStore((s) => s.taraPanelOpen)
  const tab = useUiStore((s) => s.taraPanelTab)
  const close = useUiStore((s) => s.closeTaraPanel)
  const setTab = useUiStore((s) => s.openTaraPanel)
  const activeConversationId = useUiStore((s) => s.activeConversationId)
  const conversation = useAppStore((s) => (activeConversationId ? s.conversations[activeConversationId] : undefined))
  const orderCandidates = useAppStore((s) => s.orderCandidates)
  const navigate = useNavigate()
  const [askInput, setAskInput] = useState('')
  const [localReplies, setLocalReplies] = useState<string[]>([])
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  if (!isOpen) return null

  const milestoneMessages = conversation ? conversation.messages.filter((m) => m.author === 'tara' && (m.text?.includes('✅') || m.text?.includes('🎉'))) : []

  const leads = Object.values(orderCandidates).filter((c) => c.orderId)

  const askTara = (question: string) => {
    setLocalReplies((r) => [...r, `You asked: "${question}" — here's a quick answer for the demo: this is a placeholder response. Wire this panel to a real knowledge base or LLM in production.`])
    setAskInput('')
  }

  return (
    <div className="fixed top-0 right-0 z-50 flex h-full w-[420px] max-w-[100vw] flex-col bg-white shadow-2xl">
      <div className="bg-tara-700 px-5 pt-5 pb-3 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold">
                TARA <span className="flex items-center gap-1 text-[10px] font-normal text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> ONLINE</span>
              </p>
              <p className="text-[11px] text-white/70">TRUSTED AI FOR RELIABLE ASSISTANCE</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-white/80">
            <Bell className="h-4 w-4" />
            <Smartphone className="h-4 w-4" />
            <Maximize2 className="h-4 w-4" />
            <button onClick={close}><X className="h-4.5 w-4.5" /></button>
          </div>
        </div>
        <div className="mt-4 flex gap-1 rounded-full bg-white/10 p-1 text-xs font-medium">
          {([['ask', 'Ask TARA', MessageSquare], ['fill', 'Fill proposal', ClipboardList], ['help', 'Help & FAQs', LifeBuoy]] as const).map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-2 ${tab === value ? 'bg-white text-tara-700' : 'text-white/80'}`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-surface p-4">
        {tab === 'ask' && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
              Hi 👋 — I'm <b>TARA</b>, your AI sales assistant.
              <br />
              <br />
              I can generate a summary or detailed pitch from whatever you've filled, explain product benefits, and answer your questions.
              <br />
              <br />
              Pick a card below — or just ask me anything.
            </div>
            {milestoneMessages.map((m) => (
              <div key={m.id} className="rounded-2xl bg-white p-4 text-sm whitespace-pre-line shadow-sm">
                {m.text}
              </div>
            ))}
            {localReplies.map((r, i) => (
              <div key={i} className="rounded-2xl bg-white p-4 text-sm shadow-sm">{r}</div>
            ))}
          </div>
        )}

        {tab === 'fill' && (
          <div className="space-y-3">
            {leads.length === 0 && <p className="text-sm text-gray-500">No orders yet. Start a Quick Quote or the WhatsApp demo to see them here.</p>}
            {leads.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  close()
                  navigate(`/proposal/${c.id}`)
                }}
                className="block w-full rounded-xl border border-gray-200 bg-white p-3 text-left text-sm hover:border-brand-300"
              >
                <p className="font-semibold text-gray-900">{c.customerLabel}</p>
                <p className="text-xs text-gray-500">Order {c.orderId} · {c.stage.replaceAll('_', ' ')}</p>
              </button>
            ))}
          </div>
        )}

        {tab === 'help' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                close()
                navigate('/')
              }}
              className="flex w-full items-center justify-between rounded-xl bg-brand-50 p-3 text-left text-sm"
            >
              <span className="flex items-center gap-2 font-medium text-brand-800">📣 What's new in ATOM PRO</span>
              <span className="text-xs text-brand-500">3 product updates · tap to view</span>
            </button>
            <p className="text-[11px] font-semibold tracking-wide text-gray-400 uppercase">Frequent issues · Dashboard &amp; Quick Quote</p>
            <div className="space-y-2">
              {FAQS.map((q, i) => (
                <div key={q} className="rounded-xl border border-gray-200 bg-white">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800">
                    {q}
                    <span className="text-gray-400">{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <p className="border-t border-gray-100 px-4 py-3 text-xs text-gray-500">Demo answer — in production this pulls the live help article for "{q}".</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {tab === 'ask' && (
        <div className="border-t border-gray-200 bg-white p-3">
          <div className="mb-2 grid grid-cols-2 gap-2">
            {QUICK_ACTIONS.map(({ icon: Icon, label }) => (
              <button key={label} onClick={() => askTara(label)} className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-left text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Icon className="h-3.5 w-3.5 text-brand-500" /> {label}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (askInput.trim()) askTara(askInput.trim())
            }}
            className="flex items-center gap-2 rounded-full border border-gray-300 px-3 py-2"
          >
            <input value={askInput} onChange={(e) => setAskInput(e.target.value)} placeholder="Ask TARA anything…" className="flex-1 text-sm outline-none" />
            <button type="submit" className="flex h-7 w-7 items-center justify-center rounded-full bg-tara-600 text-white"><Send className="h-3.5 w-3.5" /></button>
          </form>
        </div>
      )}
    </div>
  )
}
