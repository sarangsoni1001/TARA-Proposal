import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nextDemoId, nowIso, policyNumber } from '@/lib/ids'
import { PRODUCTS, estimatePremium } from '@/data/products'
import { extractFromMessage, classifyDocumentFileName } from '@/ai/extraction'
import {
  buildAmbiguity,
  computeMissingFields,
  computePremium,
  decideTaraReply,
  findDuplicateCustomer,
  mergeExtractedCustomerIntoCandidate,
  reconcileValidationFlags,
  runValidations,
} from '@/ai/orchestrator'
import type {
  Conversation,
  ConversationMessage,
  OrderCandidate,
  Payment,
  Policy,
  Proposal,
  Quote,
  UploadedDocument,
  FieldName,
  ProductCode,
} from '@/types'

const DEMO_OTP = '123456'

function emptyCandidate(conversationId: string, createdFromWhatsapp: boolean): OrderCandidate {
  return {
    id: nextDemoId('ORDC'),
    conversationId,
    customerLabel: 'New customer',
    product: null,
    fields: {},
    members: [],
    documents: [],
    ambiguities: [],
    validationFlags: [],
    missingFields: [],
    stage: 'COLLECTING_INFORMATION',
    createdFromWhatsapp,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    audit: [{ id: nextDemoId('EVT'), timestamp: nowIso(), label: createdFromWhatsapp ? 'Conversation started on WhatsApp' : 'Quick Quote started in ATOM Pro' }],
  }
}

function addAudit(candidate: OrderCandidate, label: string): OrderCandidate {
  return { ...candidate, audit: [...candidate.audit, { id: nextDemoId('EVT'), timestamp: nowIso(), label }] }
}

interface AppState {
  conversations: Record<string, Conversation>
  orderCandidates: Record<string, OrderCandidate>
  documents: Record<string, UploadedDocument>
  quotes: Record<string, Quote>
  proposals: Record<string, Proposal>
  payments: Record<string, Payment>
  policies: Record<string, Policy>
  processedClientMessageIds: string[]

  startConversation: (agentName: string) => string
  requestOtp: (conversationId: string) => void
  verifyOtp: (conversationId: string, code: string) => boolean

  sendAgentText: (conversationId: string, text: string, clientMessageId?: string) => void
  sendAgentAudio: (conversationId: string, transcript: string) => void
  sendAgentDocument: (conversationId: string, fileName: string, sizeLabel: string) => void
  resolveDocumentAmbiguity: (conversationId: string, ambiguityId: string, candidateId: string) => void
  handleCardAction: (conversationId: string, candidateId: string, value: string) => void

  createManualCandidate: (conversationId?: string | null) => string
  setProduct: (candidateId: string, product: ProductCode) => void
  updateField: (candidateId: string, field: FieldName, value: unknown) => void
  acceptField: (candidateId: string, field: FieldName) => void
  dismissField: (candidateId: string, field: FieldName) => void
  addManualDocument: (candidateId: string, fileName: string, sizeLabel: string) => void

  createOrderAndQuote: (candidateId: string, sumInsured: number, tenureYears: number) => void
  createProposal: (candidateId: string) => void
  pay: (candidateId: string, method: string) => void

  postTaraMessage: (conversationId: string, text: string, cardOptions?: { label: string; value: string }[], candidateId?: string) => void

  /** Internal: applies one AI extraction result to conversation/candidate state. Not part of the UI-facing API. */
  _applyExtraction: (conversationId: string, extraction: ReturnType<typeof extractFromMessage>, sourceLabel: string) => void
  /** Internal: creates the Order+Quote when the agent taps "Create Order" inside the WhatsApp simulator. */
  _createOrderFromWhatsapp: (conversationId: string, candidateId: string) => void
}

function runTurn(candidate: OrderCandidate): { candidate: OrderCandidate; taraMessages: { text: string; cardOptions?: { label: string; value: string }[] }[] } {
  let c = { ...candidate, missingFields: computeMissingFields(candidate) }
  c = { ...c, validationFlags: reconcileValidationFlags(c.validationFlags, runValidations(c)) }
  const result = decideTaraReply(c)
  if (result.readyForOrder && c.stage === 'COLLECTING_INFORMATION') {
    c = { ...c, stage: 'READY_FOR_ORDER' }
  }
  return { candidate: c, taraMessages: [{ text: result.replies[0], cardOptions: result.cardOptions }] }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      conversations: {},
      orderCandidates: {},
      documents: {},
      quotes: {},
      proposals: {},
      payments: {},
      policies: {},
      processedClientMessageIds: [],

      startConversation: (agentName) => {
        const id = nextDemoId('CONV')
        const conversation: Conversation = {
          id,
          agentName,
          authenticated: false,
          messages: [
            {
              id: nextDemoId('MSG'),
              author: 'tara',
              kind: 'text',
              text: `Hi ${agentName.split(' ')[0]} 👋 — I'm TARA. To get started, I need to verify it's you. I'll send a one-time password to your ATOM Pro registered mobile.`,
              timestamp: nowIso(),
            },
          ],
          orderCandidateIds: [],
          createdAt: nowIso(),
        }
        set((s) => ({ conversations: { ...s.conversations, [id]: conversation } }))
        return id
      },

      requestOtp: (conversationId) => {
        set((s) => {
          const conv = s.conversations[conversationId]
          if (!conv) return s
          const updated: Conversation = {
            ...conv,
            otpRequestedAt: nowIso(),
            messages: [
              ...conv.messages,
              { id: nextDemoId('MSG'), author: 'system', kind: 'text', text: `📟 OTP sent to your ATOM Pro registered mobile. (Demo OTP: ${DEMO_OTP})`, timestamp: nowIso() },
            ],
          }
          return { conversations: { ...s.conversations, [conversationId]: updated } }
        })
      },

      verifyOtp: (conversationId, code) => {
        const ok = code.trim() === DEMO_OTP
        set((s) => {
          const conv = s.conversations[conversationId]
          if (!conv) return s
          const updated: Conversation = {
            ...conv,
            authenticated: ok || conv.authenticated,
            otpVerifiedAt: ok ? nowIso() : conv.otpVerifiedAt,
            messages: [
              ...conv.messages,
              {
                id: nextDemoId('MSG'),
                author: 'tara',
                kind: 'text',
                text: ok
                  ? "You're verified ✅. Tell me who we're insuring today — one message or many, in any order works fine."
                  : "That OTP doesn't match. Please try again (demo OTP is 123456).",
                timestamp: nowIso(),
              },
            ],
          }
          return { conversations: { ...s.conversations, [conversationId]: updated } }
        })
        return ok
      },

      postTaraMessage: (conversationId, text, cardOptions, candidateId) => {
        set((s) => {
          const conv = s.conversations[conversationId]
          if (!conv) return s
          const msg: ConversationMessage = {
            id: nextDemoId('MSG'),
            author: 'tara',
            kind: cardOptions ? 'card' : 'text',
            text,
            cardOptions,
            timestamp: nowIso(),
            orderCandidateId: candidateId,
          }
          return { conversations: { ...s.conversations, [conversationId]: { ...conv, messages: [...conv.messages, msg] } } }
        })
      },

      sendAgentText: (conversationId, text, clientMessageId) => {
        const state = get()
        const conv = state.conversations[conversationId]
        if (!conv) return

        if (clientMessageId && state.processedClientMessageIds.includes(clientMessageId)) {
          set((s) => ({
            conversations: {
              ...s.conversations,
              [conversationId]: {
                ...conv,
                messages: [
                  ...conv.messages,
                  { id: nextDemoId('MSG'), author: 'agent', kind: 'text', text, timestamp: nowIso() },
                  { id: nextDemoId('MSG'), author: 'tara', kind: 'text', text: "I already have this — no changes made (duplicate message detected).", timestamp: nowIso() },
                ],
              },
            },
          }))
          return
        }

        const userMsg: ConversationMessage = { id: nextDemoId('MSG'), author: 'agent', kind: 'text', text, timestamp: nowIso() }
        set((s) => ({
          conversations: { ...s.conversations, [conversationId]: { ...conv, messages: [...conv.messages, userMsg] } },
          processedClientMessageIds: clientMessageId ? [...s.processedClientMessageIds, clientMessageId] : s.processedClientMessageIds,
        }))

        const extraction = extractFromMessage(text)
        get()._applyExtraction(conversationId, extraction, `WhatsApp message`)
      },

      sendAgentAudio: (conversationId, transcript) => {
        const conv = get().conversations[conversationId]
        if (!conv) return
        const userMsg: ConversationMessage = { id: nextDemoId('MSG'), author: 'agent', kind: 'audio', transcript, timestamp: nowIso() }
        set((s) => ({ conversations: { ...s.conversations, [conversationId]: { ...conv, messages: [...conv.messages, userMsg] } } }))
        get().postTaraMessage(conversationId, `🎙️ Voice message received. Transcribing…`)
        const extraction = extractFromMessage(transcript)
        get().postTaraMessage(conversationId, `I understood: "${transcript}"`)
        get()._applyExtraction(conversationId, extraction, `WhatsApp voice message`)
      },

      sendAgentDocument: (conversationId, fileName, sizeLabel) => {
        const conv = get().conversations[conversationId]
        if (!conv) return

        const alreadyReceived = Object.values(get().documents).some((d) => d.conversationId === conversationId && d.fileName === fileName)
        const docMsg: ConversationMessage = { id: nextDemoId('MSG'), author: 'agent', kind: 'document', text: fileName, timestamp: nowIso() }
        set((s) => ({ conversations: { ...s.conversations, [conversationId]: { ...conv, messages: [...conv.messages, docMsg] } } }))

        if (alreadyReceived) {
          get().postTaraMessage(conversationId, `I already received "${fileName}" earlier in this conversation — skipping the duplicate upload.`)
          return
        }

        const category = classifyDocumentFileName(fileName)
        const candidates = Object.values(get().orderCandidates).filter((c) => c.conversationId === conversationId)
        const doc: UploadedDocument = {
          id: nextDemoId('DOC'),
          conversationId,
          fileName,
          sizeLabel,
          category,
          status: candidates.length === 1 ? 'uploaded' : 'pending-association',
          linkedCustomerId: candidates.length === 1 ? candidates[0].id : null,
          receivedVia: 'whatsapp',
          receivedAt: nowIso(),
          messageId: docMsg.id,
        }
        set((s) => ({ documents: { ...s.documents, [doc.id]: doc } }))

        if (candidates.length === 1) {
          set((s) => ({
            orderCandidates: {
              ...s.orderCandidates,
              [candidates[0].id]: addAudit({ ...candidates[0], documents: [...candidates[0].documents, doc] }, `Document received: ${fileName}`),
            },
          }))
          get().postTaraMessage(conversationId, `Got it — linked "${fileName}" to ${candidates[0].customerLabel}.`)
        } else if (candidates.length > 1) {
          const ambiguity = buildAmbiguity(
            'multi-customer-document',
            `I found multiple active customers in this conversation. Which customer does "${fileName}" belong to?`,
            candidates.map((c) => c.id),
            doc.id,
          )
          set((s) => ({
            orderCandidates: Object.fromEntries(
              Object.entries(s.orderCandidates).map(([id, c]) => (candidates.some((x) => x.id === id) ? [id, { ...c, ambiguities: [...c.ambiguities, ambiguity] }] : [id, c])),
            ),
          }))
          get().postTaraMessage(
            conversationId,
            ambiguity.description,
            candidates.map((c) => ({ label: c.customerLabel, value: c.id })),
          )
        } else {
          get().postTaraMessage(conversationId, `I received "${fileName}" but don't have a customer to link it to yet — tell me who this is for.`)
        }
      },

      resolveDocumentAmbiguity: (conversationId, ambiguityId, candidateId) => {
        set((s) => {
          let doc: UploadedDocument | undefined
          const nextCandidates = { ...s.orderCandidates }
          for (const [id, c] of Object.entries(nextCandidates)) {
            const amb = c.ambiguities.find((a) => a.id === ambiguityId)
            if (amb) {
              doc = amb.relatedDocumentId ? s.documents[amb.relatedDocumentId] : undefined
              nextCandidates[id] = { ...c, ambiguities: c.ambiguities.map((a) => (a.id === ambiguityId ? { ...a, resolved: true } : a)) }
            }
          }
          if (doc) {
            const linkedDoc = { ...doc, linkedCustomerId: candidateId, status: 'uploaded' as const }
            nextCandidates[candidateId] = addAudit(
              { ...nextCandidates[candidateId], documents: [...nextCandidates[candidateId].documents, linkedDoc] },
              `Document linked after clarification: ${doc.fileName}`,
            )
            const label = nextCandidates[candidateId].customerLabel
            const conv = s.conversations[conversationId]
            return {
              orderCandidates: nextCandidates,
              documents: { ...s.documents, [doc.id]: linkedDoc },
              conversations: conv
                ? {
                    ...s.conversations,
                    [conversationId]: {
                      ...conv,
                      messages: [...conv.messages, { id: nextDemoId('MSG'), author: 'tara', kind: 'text', text: `Thanks — linked to ${label}.`, timestamp: nowIso() }],
                    },
                  }
                : s.conversations,
            }
          }
          return { orderCandidates: nextCandidates }
        })
      },

      handleCardAction: (conversationId, candidateId, value) => {
        if (value === 'CREATE_ORDER') {
          get()._createOrderFromWhatsapp(conversationId, candidateId)
        } else if (value === 'REVIEW_DETAILS') {
          get().postTaraMessage(conversationId, 'Here is what I have so far — check the summary card above and let me know if anything needs fixing.', undefined, candidateId)
        } else if (value === 'ADD_INFO') {
          get().postTaraMessage(conversationId, 'Sure — go ahead and share whatever else you have.', undefined, candidateId)
        } else {
          // multi-customer document-association buttons route here too
          const conv = get().conversations[conversationId]
          const candidate = get().orderCandidates[candidateId]
          if (conv && candidate) {
            const pendingAmb = candidate.ambiguities.find((a) => !a.resolved && a.kind === 'multi-customer-document')
            if (pendingAmb) get().resolveDocumentAmbiguity(conversationId, pendingAmb.id, value)
          }
        }
      },

      // --- internal helpers (not part of the public UI-facing surface, but co-located since they need set/get) ---
      _applyExtraction: (conversationId, extraction, sourceLabel) => {
        const conv = get().conversations[conversationId]
        if (!conv) return

        if (extraction.intent === 'UNKNOWN') {
          get().postTaraMessage(conversationId, "I couldn't understand that information. Could you provide the customer's name and product?")
          return
        }

        const existingCandidates = conv.orderCandidateIds.map((id) => get().orderCandidates[id]).filter(Boolean)

        extraction.customers.forEach((extractedCustomer, index) => {
          let candidate: OrderCandidate | undefined
          if (extractedCustomer.name) {
            const firstName = extractedCustomer.name.split(' ')[0].toLowerCase()
            candidate = existingCandidates.find(
              (c) => (c.fields.fullName?.value as string | undefined)?.toLowerCase().split(' ')[0] === firstName,
            )
          } else if (existingCandidates.length === 1) {
            candidate = existingCandidates[0]
          } else if (existingCandidates.length > 1 && extraction.customers.length === 1) {
            // ambiguous target for a follow-up fact with 2+ open candidates — attach to most recently updated
            candidate = [...existingCandidates].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0]
          }

          const isNew = !candidate
          if (!candidate) {
            candidate = emptyCandidate(conversationId, true)
          }

          const isCorrection = /\bactually\b|\bcorrect(ion)?\b|\bupdate\b|\bnot\b.*\bit'?s\b/i.test(extraction.rawText)
          candidate = mergeExtractedCustomerIntoCandidate(candidate, extractedCustomer, sourceLabel, isCorrection)

          const resolvedProduct = extractedCustomer.product
            ? { value: extractedCustomer.product, confidence: extractedCustomer.confidence }
            : extraction.product
          if (resolvedProduct) {
            candidate = {
              ...candidate,
              product: { value: resolvedProduct.value, source: 'whatsapp', sourceDetail: sourceLabel, confidence: resolvedProduct.confidence, status: 'suggested', extractedAt: nowIso() },
            }
          }
          if (extraction.sumInsured && extraction.customers.length === 1) {
            candidate = {
              ...candidate,
              fields: { ...candidate.fields, sumInsured: { value: extraction.sumInsured.value, source: 'whatsapp', sourceDetail: sourceLabel, confidence: extraction.sumInsured.confidence, status: 'suggested', extractedAt: nowIso() } },
            }
          }

          const dup = findDuplicateCustomer(candidate, Object.values(get().orderCandidates))
          if (dup) {
            const amb = buildAmbiguity('duplicate-customer', `${candidate.customerLabel} appears to already have an existing order. Please confirm whether this is a new proposal or an existing one.`, [candidate.id, dup.id])
            if (!candidate.ambiguities.some((a) => a.kind === 'duplicate-customer' && !a.resolved)) {
              candidate = { ...candidate, ambiguities: [...candidate.ambiguities, amb] }
            }
          }

          const { candidate: turned, taraMessages } = runTurn(candidate)
          candidate = isNew ? addAudit(turned, 'Order candidate created from WhatsApp message') : addAudit(turned, `Fields updated from ${sourceLabel}`)

          set((s) => ({
            orderCandidates: { ...s.orderCandidates, [candidate!.id]: candidate! },
            conversations: {
              ...s.conversations,
              [conversationId]: {
                ...s.conversations[conversationId],
                orderCandidateIds: isNew ? [...s.conversations[conversationId].orderCandidateIds, candidate!.id] : s.conversations[conversationId].orderCandidateIds,
              },
            },
          }))

          if (isNew && extraction.customers.length > 1) {
            get().postTaraMessage(conversationId, `Starting a new order for ${candidate.customerLabel}${candidate.product ? ` — ${PRODUCTS[candidate.product.value].name}` : ''}.`, undefined, candidate.id)
          }

          taraMessages.forEach((m) => get().postTaraMessage(conversationId, m.text, m.cardOptions, candidate!.id))

          if (index === extraction.customers.length - 1 && extraction.documents.length) {
            extraction.documents.forEach((docRef) => {
              const target = docRef.mentionedCustomerName
                ? existingCandidates.find((c) => (c.fields.fullName?.value as string)?.toLowerCase().includes(docRef.mentionedCustomerName!.toLowerCase())) ?? candidate
                : candidate
              get().sendAgentDocument(conversationId, docRef.fileName, docRef.sizeLabel)
              void target
            })
          }
        })
      },

      _createOrderFromWhatsapp: (conversationId, candidateId) => {
        const candidate = get().orderCandidates[candidateId]
        if (!candidate || !candidate.product) return
        const sumInsured = Number(candidate.fields.sumInsured?.value) || PRODUCTS[candidate.product.value].sumInsuredOptions[1]
        get().createOrderAndQuote(candidateId, sumInsured, 1)
        const updated = get().orderCandidates[candidateId]
        get().postTaraMessage(
          conversationId,
          `✅ Order created successfully for ${updated.customerLabel}. Order ID: ${updated.orderId}. You can now continue with the proposal in ATOM Pro.`,
          [{ label: 'Continue in ATOM Pro', value: `OPEN:${candidateId}` }],
          candidateId,
        )
      },

      createManualCandidate: (conversationId = null) => {
        const candidate = emptyCandidate(conversationId ?? 'manual', false)
        set((s) => ({ orderCandidates: { ...s.orderCandidates, [candidate.id]: candidate } }))
        return candidate.id
      },

      setProduct: (candidateId, product) => {
        set((s) => {
          const c = s.orderCandidates[candidateId]
          if (!c) return s
          return { orderCandidates: { ...s.orderCandidates, [candidateId]: addAudit({ ...c, product: { value: product, source: 'agent', sourceDetail: 'ATOM Pro', confidence: 1, status: 'verified', extractedAt: nowIso() } }, `Product set to ${PRODUCTS[product].name}`) } }
        })
      },

      updateField: (candidateId, field, value) => {
        set((s) => {
          const c = s.orderCandidates[candidateId]
          if (!c) return s
          const nextFields = { ...c.fields, [field]: { value, source: 'agent' as const, sourceDetail: 'ATOM Pro', confidence: 1, status: 'verified' as const, extractedAt: nowIso() } }
          const customerLabel = field === 'fullName' && String(value).trim() ? String(value) : c.customerLabel
          let next: OrderCandidate = { ...c, fields: nextFields, customerLabel, missingFields: computeMissingFields({ ...c, fields: nextFields }) }
          next = { ...next, validationFlags: reconcileValidationFlags(next.validationFlags, runValidations(next)) }
          if (['PROPOSAL_CREATED', 'PAYMENT_SUCCESS', 'POLICY_CONVERTED'].includes(next.stage)) {
            next = addAudit({ ...next, stage: 'NEEDS_REVIEW' }, `Agent edited ${field} after submission — proposal marked Needs Review`)
          }
          return { orderCandidates: { ...s.orderCandidates, [candidateId]: next } }
        })
      },

      acceptField: (candidateId, field) => {
        set((s) => {
          const c = s.orderCandidates[candidateId]
          if (!c) return s
          const existing = c.fields[field]
          if (!existing) return s
          const nextFields = { ...c.fields, [field]: { ...existing, status: 'accepted' as const } }
          return { orderCandidates: { ...s.orderCandidates, [candidateId]: { ...c, fields: nextFields, missingFields: computeMissingFields({ ...c, fields: nextFields }) } } }
        })
      },

      dismissField: (candidateId, field) => {
        set((s) => {
          const c = s.orderCandidates[candidateId]
          if (!c) return s
          const nextFields = { ...c.fields }
          delete nextFields[field]
          return { orderCandidates: { ...s.orderCandidates, [candidateId]: { ...c, fields: nextFields, missingFields: computeMissingFields({ ...c, fields: nextFields }) } } }
        })
      },

      addManualDocument: (candidateId, fileName, sizeLabel) => {
        set((s) => {
          const c = s.orderCandidates[candidateId]
          if (!c) return s
          const doc: UploadedDocument = {
            id: nextDemoId('DOC'),
            conversationId: c.conversationId,
            fileName,
            sizeLabel,
            category: classifyDocumentFileName(fileName),
            status: 'uploaded',
            linkedCustomerId: candidateId,
            receivedVia: 'atompro',
            receivedAt: nowIso(),
          }
          return {
            documents: { ...s.documents, [doc.id]: doc },
            orderCandidates: { ...s.orderCandidates, [candidateId]: addAudit({ ...c, documents: [...c.documents, doc] }, `Document uploaded in ATOM Pro: ${fileName}`) },
          }
        })
      },

      createOrderAndQuote: (candidateId, sumInsured, tenureYears) => {
        const candidate = get().orderCandidates[candidateId]
        if (!candidate || !candidate.product) return
        const orderId = nextDemoId('ORD')
        const quoteId = nextDemoId('QUO')
        const premium = estimatePremium(candidate.product.value, sumInsured, tenureYears)
        const quote: Quote = { id: quoteId, orderId, product: candidate.product.value, sumInsured, tenureYears, premium, createdAt: nowIso() }
        set((s) => ({
          quotes: { ...s.quotes, [quoteId]: quote },
          orderCandidates: {
            ...s.orderCandidates,
            [candidateId]: addAudit(
              {
                ...candidate,
                orderId,
                quoteId,
                premium,
                stage: 'QUOTE_CREATED',
                fields: {
                  ...candidate.fields,
                  sumInsured: { value: sumInsured, source: 'agent', sourceDetail: 'ATOM Pro', confidence: 1, status: 'verified', extractedAt: nowIso() },
                  policyTenureYears: { value: tenureYears, source: 'agent', sourceDetail: 'ATOM Pro', confidence: 1, status: 'verified', extractedAt: nowIso() },
                },
              },
              `Order ${orderId} and Quote ${quoteId} created — moved to Master Leads › Retail › Quotes`,
            ),
          },
        }))
      },

      createProposal: (candidateId) => {
        const candidate = get().orderCandidates[candidateId]
        if (!candidate || !candidate.quoteId || !candidate.orderId) return
        const proposalId = nextDemoId('PROP')
        const proposal: Proposal = { id: proposalId, quoteId: candidate.quoteId, orderId: candidate.orderId, status: 'draft', createdAt: nowIso() }
        set((s) => ({
          proposals: { ...s.proposals, [proposalId]: proposal },
          orderCandidates: { ...s.orderCandidates, [candidateId]: addAudit({ ...candidate, proposalId, stage: 'PROPOSAL_IN_PROGRESS' }, `Proposal ${proposalId} created — moved to Master Leads › Retail › Proposals`) },
        }))
        if (candidate.conversationId && get().conversations[candidate.conversationId]) {
          get().postTaraMessage(candidate.conversationId, `✅ Proposal created successfully.\nProposal ID: ${proposalId}\nThe proposal is now available under Master Leads → Retail → Proposals.`, undefined, candidateId)
        }
      },

      pay: (candidateId, method) => {
        const candidate = get().orderCandidates[candidateId]
        if (!candidate || !candidate.proposalId) return
        const paymentId = nextDemoId('PAY')
        const amount = candidate.premium ?? computePremium(candidate)
        const payment: Payment = { id: paymentId, proposalId: candidate.proposalId, amount, status: 'success', createdAt: nowIso() }
        set((s) => ({
          payments: { ...s.payments, [paymentId]: payment },
          proposals: { ...s.proposals, [candidate.proposalId!]: { ...s.proposals[candidate.proposalId!], status: 'submitted' } },
          orderCandidates: { ...s.orderCandidates, [candidateId]: addAudit({ ...candidate, paymentId, stage: 'PAYMENT_SUCCESS' }, `Payment ${paymentId} completed via ${method}`) },
        }))
        if (candidate.conversationId && get().conversations[candidate.conversationId]) {
          get().postTaraMessage(candidate.conversationId, `✅ Payment completed successfully.\nPayment reference: ${paymentId}`, undefined, candidateId)
        }

        // Policy conversion follows payment automatically for this product (mirrors the near-instant
        // issuance shown in the reference screenshots) — still a distinct, auditable step.
        const policyId = nextDemoId('POL')
        const polNumber = policyNumber()
        const custName = (candidate.fields.fullName?.value as string) || candidate.customerLabel
        const policy: Policy = { id: policyId, paymentId, policyNumber: polNumber, sumInsured: Number(candidate.fields.sumInsured?.value) || 0, premium: amount, customerName: custName, createdAt: nowIso() }
        set((s) => ({
          policies: { ...s.policies, [policyId]: policy },
          orderCandidates: { ...s.orderCandidates, [candidateId]: addAudit({ ...get().orderCandidates[candidateId], policyId, stage: 'POLICY_CONVERTED' }, `Policy ${policyId} issued — moved to Master Leads › Retail › Policies`) },
        }))
        if (candidate.conversationId && get().conversations[candidate.conversationId]) {
          get().postTaraMessage(
            candidate.conversationId,
            `🎉 Policy issued! ${PRODUCTS[candidate.product!.value].name} for ${custName} is now active.\n\nPolicy No: ${polNumber}\nSum Insured: ₹${(policy.sumInsured / 100000).toFixed(0)} Lakh · Premium: ₹${amount.toLocaleString('en-IN')}\n\nIt has moved to Leads › Policies. The policy kit has been emailed to the customer.`,
            undefined,
            candidateId,
          )
        }
      },
    }),
    { name: 'tara-proposal-demo-store', version: 1 },
  ),
)
