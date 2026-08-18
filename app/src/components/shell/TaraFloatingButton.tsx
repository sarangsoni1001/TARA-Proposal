import { Sparkles } from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'

export function TaraFloatingButton() {
  const open = useUiStore((s) => s.openTaraPanel)
  const isOpen = useUiStore((s) => s.taraPanelOpen)
  if (isOpen) return null
  return (
    <button
      onClick={() => open()}
      className="fixed right-6 bottom-6 z-40 flex items-center gap-2 rounded-full bg-tara-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg hover:bg-tara-700"
    >
      <Sparkles className="h-4.5 w-4.5" /> TARA
    </button>
  )
}
