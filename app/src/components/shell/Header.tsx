import { ShieldCheck, Headphones, ChevronDown, MessageCircle } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'

export function Header() {
  const navigate = useNavigate()
  const startConversation = useAppStore((s) => s.startConversation)
  const setActiveConversationId = useUiStore((s) => s.setActiveConversationId)

  const openWhatsAppDemo = () => {
    const id = startConversation('Prakash Babu L')
    setActiveConversationId(id)
    navigate('/whatsapp')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <Link to="/" className="flex items-center gap-2">
        <ShieldCheck className="h-7 w-7 text-brand-600" />
        <div className="leading-tight text-left">
          <p className="text-lg font-bold text-gray-900">STAR</p>
          <p className="-mt-1 text-[11px] text-gray-500">Health Insurance</p>
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <button
          onClick={openWhatsAppDemo}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 px-3.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp demo
        </button>
        <Headphones className="h-5 w-5 text-gray-500" />
        <button className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs text-brand-700">PB</span>
          PRAKASH BABU L <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </header>
  )
}
