import { Sparkles, Check, X } from 'lucide-react'
import type { ExtractedField } from '@/types'

/**
 * The core "prefill" mechanic (PROMPT.md section 11 / image10-20-36.png):
 * a WhatsApp-sourced value is offered as a suggestion chip under an empty
 * field. It is never written into the field until the agent explicitly
 * clicks "Use this" — the agent stays the final decision-maker.
 */
export function PrefillChip({
  field,
  onUse,
  onDismiss,
}: {
  field: ExtractedField
  onUse: () => void
  onDismiss: () => void
}) {
  const via = field.source === 'whatsapp' ? 'WHATSAPP · TARA' : field.source === 'document' ? 'DOCUMENT · TARA' : 'TARA'
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-100 bg-brand-50 px-3 py-2">
      <div className="min-w-0">
        <p className="flex items-center gap-1 text-[10px] font-semibold tracking-wide text-brand-500 uppercase">
          <Sparkles className="h-3 w-3" /> Tara found · {via}
        </p>
        <p className="truncate font-semibold text-brand-900">{String(field.value)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onUse}
          className="flex items-center gap-1 rounded-md bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
        >
          <Check className="h-3.5 w-3.5" /> Use this
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss suggestion"
          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
