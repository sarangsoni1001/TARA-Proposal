import { useAppStore } from '@/store/useAppStore'
import { PrefillChip } from './PrefillChip'
import type { FieldName } from '@/types'

export function FieldWithPrefill({
  candidateId,
  field,
  label,
  placeholder,
  type = 'text',
  required = true,
}: {
  candidateId: string
  field: FieldName
  label: string
  placeholder?: string
  type?: string
  required?: boolean
}) {
  const candidateField = useAppStore((s) => s.orderCandidates[candidateId]?.fields[field])
  const updateField = useAppStore((s) => s.updateField)
  const acceptField = useAppStore((s) => s.acceptField)
  const dismissField = useAppStore((s) => s.dismissField)

  const isFilled = candidateField && (candidateField.status === 'accepted' || candidateField.status === 'verified')
  const isSuggestion = candidateField && candidateField.status === 'suggested'

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-brand-700">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={isFilled ? String(candidateField.value) : ''}
        onChange={(e) => updateField(candidateId, field, type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-400 focus:ring-1 focus:ring-brand-400 focus:outline-none"
      />
      {isSuggestion && (
        <div className="mt-2">
          <PrefillChip field={candidateField} onUse={() => acceptField(candidateId, field)} onDismiss={() => dismissField(candidateId, field)} />
        </div>
      )}
    </div>
  )
}
