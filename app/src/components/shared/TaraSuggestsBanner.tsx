import { Sparkles } from 'lucide-react'

export function TaraSuggestsBanner({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex gap-2 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-brand-500 uppercase">Tara suggests</p>
        <p className="font-medium text-brand-800">{title}</p>
        {detail && <p className="mt-0.5 text-xs text-brand-600">{detail}</p>}
      </div>
    </div>
  )
}
