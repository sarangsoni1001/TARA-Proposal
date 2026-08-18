import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Mic, Paperclip, ShieldCheck, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { PRODUCTS } from '@/data/products'

const SCRIPTS: { group: string; items: { label: string; text: string }[] }[] = [
  {
    group: 'Scenario 1 · Simple order',
    items: [{ label: 'Superstar for Rajesh, 42, Mumbai, 10L', text: 'Need Superstar for Rajesh Kumar age 42 Mumbai 10 lakh cover.' }],
  },
  {
    group: 'Scenario 2 · Multiple messages',
    items: [
      { label: '1) Family details', text: 'Wife Sunita 38 and son Aarav 12.' },
      { label: '2) Mobile', text: 'Mobile is 9876543210.' },
      { label: '3) Address', text: 'Address is Mulund West, Mumbai 400081.' },
    ],
  },
  {
    group: 'Scenario 3 · Random order fragments',
    items: [
      { label: 'City only', text: 'Mumbai' },
      { label: 'Product only', text: 'Superstar' },
      { label: 'Mobile only', text: '9876543210' },
      { label: 'Name only', text: 'Rajesh Kumar' },
      { label: 'Age only', text: '42' },
    ],
  },
  {
    group: 'Scenario 4/5 · Two customers, two products',
    items: [{ label: 'Rajesh–Superstar & Priya–Assure', text: "Create Superstar for Rajesh age 42 Mumbai and Assure for Priya age 34 Pune. Rajesh's number is 9876543210. I'll send documents for both." }],
  },
  {
    group: 'Scenario 8 · Correction, not duplication',
    items: [{ label: 'Actually Rajesh is 45', text: 'Actually Rajesh is 45.' }],
  },
  {
    group: 'Scenario 9 · AI-detected mismatch',
    items: [{ label: 'Conflicting DOB', text: 'His DOB is 15/03/1970.' }],
  },
]

const DOC_SCRIPTS = [
  { label: "Rajesh's Aadhaar", file: 'Aadhaar_front_masked.jpg', size: '1.2 MB' },
  { label: "Rajesh's PAN", file: 'PAN_Rajesh_Kumar.jpg', size: '0.6 MB' },
  { label: 'Cancelled cheque', file: 'HDFC_cancelled_cheque.jpg', size: '0.8 MB' },
  { label: 'Salary slip', file: 'Salary_slip_June.pdf', size: '0.3 MB' },
  { label: 'Unlabelled scan (ambiguous)', file: 'scan_0912.jpg', size: '0.9 MB' },
]

export function WhatsApp() {
  const navigate = useNavigate()
  const activeConversationId = useUiStore((s) => s.activeConversationId)
  const setActiveConversationId = useUiStore((s) => s.setActiveConversationId)
  const startConversation = useAppStore((s) => s.startConversation)
  const requestOtp = useAppStore((s) => s.requestOtp)
  const verifyOtp = useAppStore((s) => s.verifyOtp)
  const sendAgentText = useAppStore((s) => s.sendAgentText)
  const sendAgentAudio = useAppStore((s) => s.sendAgentAudio)
  const sendAgentDocument = useAppStore((s) => s.sendAgentDocument)
  const handleCardAction = useAppStore((s) => s.handleCardAction)
  const conversation = useAppStore((s) => (activeConversationId ? s.conversations[activeConversationId] : undefined))
  const orderCandidates = useAppStore((s) => s.orderCandidates)

  const [input, setInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [showAudioBox, setShowAudioBox] = useState(false)
  const [audioText, setAudioText] = useState('')
  const [showDocPicker, setShowDocPicker] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeConversationId) {
      const id = startConversation('Prakash Babu L')
      setActiveConversationId(id)
    }
  }, [activeConversationId, startConversation, setActiveConversationId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [conversation?.messages.length])

  if (!activeConversationId || !conversation) {
    return <div className="p-10 text-center text-sm text-gray-400">Starting conversation…</div>
  }

  const candidates = conversation.orderCandidateIds.map((id) => orderCandidates[id]).filter(Boolean)

  const send = () => {
    if (!input.trim()) return
    sendAgentText(activeConversationId, input.trim())
    setInput('')
  }

  const sendDuplicate = () => {
    const lastAgentMsg = [...conversation.messages].reverse().find((m) => m.author === 'agent' && m.kind === 'text')
    if (lastAgentMsg) sendAgentText(activeConversationId, lastAgentMsg.text ?? '', 'fixed-demo-dup-key')
  }

  return (
    <div className="flex h-screen bg-[#e9edf3]">
      <div className="mx-auto flex h-full w-full max-w-6xl gap-4 p-4">
        <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl bg-white p-4">
          <button onClick={() => navigate('/')} className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" /> Back to ATOM Pro
          </button>
          <p className="text-xs font-semibold tracking-wide text-gray-400 uppercase">Demo scripts</p>
          {SCRIPTS.map((g) => (
            <div key={g.group}>
              <p className="mb-1 text-[11px] font-semibold text-brand-600">{g.group}</p>
              <div className="mb-2 flex flex-col gap-1">
                {g.items.map((it) => (
                  <button
                    key={it.label}
                    onClick={() => sendAgentText(activeConversationId, it.text)}
                    className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-left text-xs text-gray-600 hover:border-brand-300 hover:bg-brand-50"
                  >
                    {it.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button onClick={sendDuplicate} className="rounded-lg border border-dashed border-gray-300 px-2.5 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50">
            Scenario · Resend last message (duplicate test)
          </button>
        </div>

        <div className="flex flex-1 flex-col rounded-2xl bg-[#efeae2]">
          <div className="flex items-center gap-3 rounded-t-2xl bg-brand-800 px-5 py-3 text-white">
            <Sparkles className="h-5 w-5" />
            <div>
              <p className="text-sm font-semibold">TARA · Star Health WhatsApp</p>
              <p className="text-[11px] text-white/70">{conversation.authenticated ? 'Authenticated agent session' : 'Awaiting OTP verification'}</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {conversation.messages.map((m) => {
              if (m.author === 'system') {
                return (
                  <p key={m.id} className="mx-auto w-fit rounded-full bg-black/5 px-3 py-1 text-center text-[11px] text-gray-500">
                    {m.text}
                  </p>
                )
              }
              const isAgent = m.author === 'agent'
              return (
                <div key={m.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line shadow-sm ${isAgent ? 'bg-[#d9fdd3] text-gray-800' : 'bg-white text-gray-800'}`}>
                    {m.kind === 'document' ? (
                      <span className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-gray-400" /> {m.text}</span>
                    ) : m.kind === 'audio' ? (
                      <span className="flex items-center gap-2"><Mic className="h-4 w-4 text-gray-400" /> Voice note — "{m.transcript}"</span>
                    ) : (
                      m.text
                    )}
                    {m.cardOptions && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {m.cardOptions.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => {
                              if (opt.value.startsWith('OPEN:')) {
                                navigate(`/proposal/${opt.value.replace('OPEN:', '')}`)
                                return
                              }
                              handleCardAction(activeConversationId, m.orderCandidateId ?? '', opt.value)
                            }}
                            className="rounded-full border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100"
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {!conversation.authenticated ? (
            <div className="rounded-b-2xl border-t border-black/5 bg-white p-4">
              {!conversation.otpRequestedAt ? (
                <button onClick={() => requestOtp(activeConversationId)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white">
                  <ShieldCheck className="h-4 w-4" /> Send OTP to verify agent
                </button>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    verifyOtp(activeConversationId, otpInput)
                    setOtpInput('')
                  }}
                  className="flex gap-2"
                >
                  <input value={otpInput} onChange={(e) => setOtpInput(e.target.value)} placeholder="Enter OTP (123456)" className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm" />
                  <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white">Verify</button>
                </form>
              )}
            </div>
          ) : (
            <div className="rounded-b-2xl border-t border-black/5 bg-white p-3">
              {showAudioBox && (
                <div className="mb-2 flex gap-2">
                  <input value={audioText} onChange={(e) => setAudioText(e.target.value)} placeholder='Simulated speech, e.g. "Rajesh Kumar, 42 years old, Mumbai, Superstar"' className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                  <button
                    onClick={() => {
                      if (!audioText.trim()) return
                      sendAgentAudio(activeConversationId, audioText.trim())
                      setAudioText('')
                      setShowAudioBox(false)
                    }}
                    className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Send voice note
                  </button>
                </div>
              )}
              {showDocPicker && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {DOC_SCRIPTS.map((d) => (
                    <button
                      key={d.file}
                      onClick={() => {
                        sendAgentDocument(activeConversationId, d.file, d.size)
                        setShowDocPicker(false)
                      }}
                      className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => setShowDocPicker((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                  <Paperclip className="h-4.5 w-4.5" />
                </button>
                <button onClick={() => setShowAudioBox((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
                  <Mic className="h-4.5 w-4.5" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Type a message"
                  className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm"
                />
                <button onClick={send} className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-72 shrink-0 space-y-3 overflow-y-auto">
          {candidates.length === 0 && <div className="rounded-2xl bg-white p-4 text-xs text-gray-400">No order candidates yet — send a message to get started.</div>}
          {candidates.map((c) => {
            const productName = c.product ? PRODUCTS[c.product.value].name : 'Product pending'
            const checklist = [
              ['Agent authenticated', conversation.authenticated],
              ['Customer details captured', Boolean(c.fields.fullName)],
              ['Documents received', c.documents.length > 0],
              ['Order created', Boolean(c.orderId)],
              ['Quote created', Boolean(c.quoteId)],
            ] as const
            return (
              <div key={c.id} className="rounded-2xl bg-white p-4">
                <p className="text-sm font-semibold text-gray-900">{c.customerLabel}</p>
                <p className="mb-2 text-xs text-gray-500">{productName}</p>
                <ul className="space-y-1 text-xs">
                  {checklist.map(([label, done]) => (
                    <li key={label} className={done ? 'text-emerald-600' : 'text-gray-400'}>
                      {done ? '✅' : '⚪'} {label}
                    </li>
                  ))}
                </ul>
                {c.orderId && (
                  <button onClick={() => navigate(`/proposal/${c.id}`)} className="mt-3 w-full rounded-lg bg-brand-700 py-2 text-xs font-semibold text-white">
                    Continue in ATOM Pro
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
