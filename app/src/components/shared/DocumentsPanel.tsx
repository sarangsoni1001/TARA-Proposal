import { useRef } from 'react'
import { FileText, CheckCircle2, Upload } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { TaraSuggestsBanner } from './TaraSuggestsBanner'
import { PRODUCTS } from '@/data/products'

export function DocumentsPanel({ candidateId }: { candidateId: string }) {
  const candidate = useAppStore((s) => s.orderCandidates[candidateId])
  const addManualDocument = useAppStore((s) => s.addManualDocument)
  const inputRef = useRef<HTMLInputElement>(null)

  if (!candidate) return null

  const whatsappDocs = candidate.documents.filter((d) => d.receivedVia === 'whatsapp')
  const required = candidate.product ? PRODUCTS[candidate.product.value].requiredDocuments : []

  const onPick = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((f) => addManualDocument(candidateId, f.name, `${(f.size / 1024 / 1024).toFixed(1)} MB`))
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault()
          onPick(e.dataTransfer.files)
        }}
        onDragOver={(e) => e.preventDefault()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 hover:border-brand-300"
      >
        <Upload className="mx-auto mb-2 h-5 w-5 text-gray-400" />
        Click to upload and attach files TIFF, PNG, JPEG, JPG or TIF (max. 10 MB)
        <p className="mt-1 text-xs text-gray-400">Note: Please ensure that the first 8 digits of the Aadhaar number are masked in case Aadhaar card is uploaded as any proof.</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onPick(e.target.files)} />
      </div>

      <TaraSuggestsBanner title='Keep each document under 10 MB — oversized scans are the #1 cause of "Something went wrong!"' detail="If an upload fails, I'll read the backend error and tell you exactly how to fix it." />

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-brand-600 uppercase">
          <FileText className="h-3.5 w-3.5" /> Documents collected by Tara
        </p>
        {whatsappDocs.length === 0 && <p className="text-sm text-gray-400">No documents received over WhatsApp yet.</p>}
        <div className="space-y-2">
          {whatsappDocs.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm">
              <span className="flex items-center gap-2 text-gray-700">
                <FileText className="h-4 w-4 text-gray-400" /> {d.fileName} <span className="text-xs text-gray-400">{d.sizeLabel}</span>
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded · {d.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">Proposer Documents</p>
        <p className="mb-3 text-xs text-gray-500">Documents required for the proposer{required.length ? ` (${required.join(', ')})` : ''}</p>
        <div className="grid grid-cols-2 gap-2">
          {candidate.documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
              {d.fileName}
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          ))}
          {candidate.documents.length === 0 && <p className="col-span-2 text-sm text-gray-400">No documents attached yet.</p>}
        </div>
      </div>
    </div>
  )
}
