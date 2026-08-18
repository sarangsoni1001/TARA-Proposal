// Core domain types for the WhatsApp -> TARA -> ATOM Pro prototype.
// See PROMPT.md sections 6, 9.2, 13, 15 for the requirements these model.

export type ProductCode = 'SUPERSTAR' | 'ASSURE'

export type FieldSource = 'whatsapp' | 'tara' | 'agent' | 'document' | 'system'

export interface ExtractedField<T = unknown> {
  value: T
  source: FieldSource
  sourceDetail: string // e.g. "WhatsApp message #2", "Aadhaar_front.jpg"
  confidence: number // 0..1
  status: 'suggested' | 'accepted' | 'rejected' | 'verified'
  extractedAt: string
}

export type FieldName =
  | 'title'
  | 'fullName'
  | 'dob'
  | 'age'
  | 'mobile'
  | 'email'
  | 'city'
  | 'pincode'
  | 'addressLine1'
  | 'addressLine2'
  | 'occupation'
  | 'annualIncome'
  | 'panAvailable'
  | 'accountHolderName'
  | 'accountNumber'
  | 'ifsc'
  | 'bankName'
  | 'nomineeName'
  | 'nomineeRelationship'
  | 'sumInsured'
  | 'policyTenureYears'
  | 'numAdults'
  | 'numChildren'

export type FieldValues = Partial<Record<FieldName, ExtractedField>>

export interface FamilyMember {
  id: string
  type: 'adult' | 'child'
  age?: ExtractedField<number>
}

export type DocumentCategory =
  | 'ADD_PROOF'
  | 'FORM_60'
  | 'BANK_DETAILS'
  | 'INCOME_PROOF'
  | 'MEDICAL'
  | 'UNKNOWN'

export interface UploadedDocument {
  id: string
  conversationId: string | null
  fileName: string
  sizeLabel: string
  category: DocumentCategory
  status: 'uploaded' | 'pending-association' | 'rejected'
  linkedCustomerId: string | null
  receivedVia: 'whatsapp' | 'atompro'
  receivedAt: string
  messageId?: string
}

export type OrderStage =
  | 'COLLECTING_INFORMATION'
  | 'READY_FOR_ORDER'
  | 'ORDER_CREATED'
  | 'QUOTE_CREATED'
  | 'PROPOSAL_IN_PROGRESS'
  | 'PROPOSAL_CREATED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESS'
  | 'POLICY_CONVERTED'
  | 'NEEDS_REVIEW'

export interface Ambiguity {
  id: string
  kind: 'multi-customer-document' | 'multi-customer-field' | 'low-confidence-field' | 'duplicate-customer'
  description: string
  relatedDocumentId?: string
  candidateCustomerIds: string[]
  resolved: boolean
  resolution?: string
}

export interface ValidationFlag {
  id: string
  field: FieldName | 'document'
  severity: 'warning' | 'blocking'
  message: string
  createdAt: string
  resolved: boolean
}

export interface AuditEvent {
  id: string
  timestamp: string
  label: string
}

export interface OrderCandidate {
  id: string
  conversationId: string
  customerLabel: string // best-known display name, may be provisional
  product: ExtractedField<ProductCode> | null
  fields: FieldValues
  members: FamilyMember[]
  documents: UploadedDocument[]
  ambiguities: Ambiguity[]
  validationFlags: ValidationFlag[]
  missingFields: FieldName[]
  stage: OrderStage
  createdFromWhatsapp: boolean
  createdAt: string
  updatedAt: string
  audit: AuditEvent[]
  orderId?: string
  quoteId?: string
  proposalId?: string
  paymentId?: string
  policyId?: string
  premium?: number
}

export type MessageAuthor = 'agent' | 'tara' | 'system'
export type MessageKind = 'text' | 'audio' | 'document' | 'card' | 'milestone'

export interface ConversationMessage {
  id: string
  author: MessageAuthor
  kind: MessageKind
  text?: string
  transcript?: string // for audio
  documentId?: string
  cardOptions?: { label: string; value: string }[]
  timestamp: string
  orderCandidateId?: string
}

export interface Conversation {
  id: string
  agentName: string
  authenticated: boolean
  otpRequestedAt?: string
  otpVerifiedAt?: string
  messages: ConversationMessage[]
  orderCandidateIds: string[]
  createdAt: string
}

// --- Post-order ATOM Pro records -------------------------------------------------

export interface Quote {
  id: string
  orderId: string
  product: ProductCode
  sumInsured: number
  tenureYears: number
  premium: number
  createdAt: string
}

export interface Proposal {
  id: string
  quoteId: string
  orderId: string
  status: 'draft' | 'submitted'
  createdAt: string
}

export interface Payment {
  id: string
  proposalId: string
  amount: number
  status: 'success' | 'failed'
  createdAt: string
}

export interface Policy {
  id: string
  paymentId: string
  policyNumber: string
  sumInsured: number
  premium: number
  customerName: string
  createdAt: string
}

// --- AI extraction layer output (PROMPT.md section 15) ---------------------------

export interface ExtractedCustomer {
  matchKey: string // best-effort local key within this extraction batch, e.g. "customer-1"
  name?: string
  product?: ProductCode // set when this specific customer's product was identified (multi-customer messages)
  dob?: string
  age?: number
  mobile?: string
  email?: string
  city?: string
  pincode?: string
  addressLine1?: string
  occupation?: string
  annualIncome?: number
  accountHolderName?: string
  accountNumber?: string
  ifsc?: string
  bankName?: string
  nomineeName?: string
  nomineeRelationship?: string
  numAdults?: number
  numChildren?: number
  memberAges?: number[]
  confidence: number
}

export interface ExtractedDocumentRef {
  fileName: string
  sizeLabel: string
  category: DocumentCategory
  mentionedCustomerName?: string // e.g. "Rajesh's Aadhaar" -> "Rajesh"
}

export interface ExtractionResult {
  intent: 'CREATE_OR_UPDATE_ORDER' | 'PROVIDE_DOCUMENT' | 'CONFIRM' | 'UNKNOWN'
  product?: { value: ProductCode; confidence: number }
  sumInsured?: { value: number; confidence: number }
  customers: ExtractedCustomer[]
  documents: ExtractedDocumentRef[]
  rawText: string
}
