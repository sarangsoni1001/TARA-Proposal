import { AlertTriangle } from 'lucide-react'

export function TaraWarningBanner({ message, blocking }: { message: string; blocking?: boolean }) {
  return (
    <div className={`flex gap-2 rounded-lg border p-3 text-sm ${blocking ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
      <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${blocking ? 'text-rose-500' : 'text-amber-500'}`} />
      <div>
        <p className={`text-[11px] font-semibold tracking-wide uppercase ${blocking ? 'text-rose-500' : 'text-amber-600'}`}>Tara suggests</p>
        <p className={blocking ? 'text-rose-800' : 'text-amber-800'}>{message}</p>
      </div>
    </div>
  )
}
