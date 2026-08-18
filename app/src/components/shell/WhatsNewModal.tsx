import { Megaphone, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'

const ITEMS = [
  {
    title: 'Start a proposal on WhatsApp',
    body: 'Share details by chat, voice note or a photo of the KYC documents — TARA now creates the order and prefills the ATOM PRO proposal form for you.',
  },
  {
    title: 'TARA now explains errors',
    body: 'If an upload or a form step fails, TARA reads the backend error log, tells you exactly what went wrong and gives you the fix — no more generic "Something went wrong!".',
  },
  {
    title: 'Live policy status updates',
    body: 'Payment success and policy issuance now ping you instantly on WhatsApp and here, and the case moves from Quotes → Proposals → Policies automatically.',
  },
]

export function WhatsNewModal() {
  const dismissed = useUiStore((s) => s.whatsNewDismissed)
  const dismiss = useUiStore((s) => s.dismissWhatsNew)
  const setActiveConversationId = useUiStore((s) => s.setActiveConversationId)
  const startConversation = useAppStore((s) => s.startConversation)
  const navigate = useNavigate()

  if (dismissed) return null

  const tryWhatsApp = () => {
    const id = startConversation('Prakash Babu L')
    setActiveConversationId(id)
    dismiss()
    navigate('/whatsapp')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <p className="flex items-center gap-2 font-semibold text-brand-700"><Megaphone className="h-4.5 w-4.5" /> What's new</p>
          <button onClick={dismiss}><X className="h-4.5 w-4.5 text-gray-400" /></button>
        </div>
        <div className="divide-y divide-gray-100">
          {ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-3 px-5 py-4">
              <span className="mt-0.5 shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">NEW</span>
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                <p className="mt-0.5 text-sm text-gray-500">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4">
          <button onClick={tryWhatsApp} className="w-full rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-800">
            Try the WhatsApp journey
          </button>
        </div>
      </div>
    </div>
  )
}
