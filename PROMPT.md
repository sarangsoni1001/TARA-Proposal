# Claude Code Build Prompt — WhatsApp → TARA → ATOM Pro Prefilled Proposal Journey

> This file is the implementation brief for Claude Code. It has been rewritten from the raw
> stakeholder requirement into a structured, unambiguous spec. Read this entire document,
> and look at every image in `docs/reference-screenshots/`, before writing any code.

---

## 0. Repository state — read this first

`TARA-Proposal` currently contains **no application code** — this is a greenfield build.

This changes how you should treat the "do not change the existing UI" instruction below:
there is no existing codebase to inspect yet, so `docs/reference-screenshots/` (44 images,
`image1.png`–`image44.png`, described in §3) **is** the existing ATOM Pro design. Treat those
screenshots as production screenshots you must faithfully reproduce — not moodboard
inspiration you can reinterpret. Match layout, spacing, copy, component structure, and
interaction pattern as closely as static images allow. Once you have built the initial ATOM
Pro screens to match the reference, that code becomes the real "existing implementation" —
from that point forward, reuse it rather than re-deriving it, and never redesign it casually
while adding the WhatsApp/TARA layer on top.

---

## 1. Role

Act as a senior product engineer, AI/UX architect, and full-stack implementer. You are
building an end-to-end functional prototype of the following journey:

```
Agent → WhatsApp → TARA → ATOM Pro → Quote → Proposal → Payment → Policy
```

The agent's input over WhatsApp is unpredictable (free text, voice, documents, multiple
customers in one conversation, information in any order). Design for that reality — this is
not a scripted-chatbot demo. It is a prototype that credibly shows how this would work in
production, while keeping the existing ATOM Pro proposal experience completely intact.

---

## 2. Absolute non-negotiable requirement

**Do not change the existing ATOM Pro proposal UI or design.** This is the highest-priority
constraint in this entire brief, ranked above every other requirement (see the priority order
in §19).

Concretely:
- Do not redesign proposal screens, replace their components, change field layouts,
  navigation, buttons, interaction patterns, or visual language.
- Do not introduce a second/parallel proposal UI inside WhatsApp.
- Do not modify the proposal form just to make WhatsApp integration easier.
- Do not duplicate existing proposal functionality unnecessarily.

The WhatsApp experience is an **intelligent prefill / orchestration layer** in front of the
existing ATOM Pro proposal journey — never a replacement for it:

```
WhatsApp
  ↓
TARA / AI Interpretation Layer
  ↓
Structured Customer / Proposal Data
  ↓
ATOM Pro Order / Quote
  ↓
EXISTING ATOM Pro Proposal Journey   ← source of truth for proposal creation, unchanged
  ↓
Payment
  ↓
Policy Conversion
```

Before any UI change, ask: *"Am I modifying the existing ATOM Pro proposal experience?"* If
yes, don't — unless integration is genuinely impossible without it.

---

## 3. Reference screenshots — what they prove and how to use them

`docs/reference-screenshots/image1.png` … `image44.png` are, in sequence, an end-to-end walk
of the ATOM Pro proposal journey through payment and policy issuance. They were produced from
a Lovable-built design prototype, so some already show **mocked versions of the target
WhatsApp/TARA experience** — use those as your literal spec for copy and component naming,
not just layout. Verified anchor points (open the full set — this is not exhaustive):

| File | What it shows | Why it matters |
|---|---|---|
| `image1.png` | ATOM Pro home dashboard: left nav (Home, New Business, Existing Customer, GMC Business, Business Reports, My Centre, Tools, Grow Your Business, Help & Support, More Information), header with a **"WhatsApp demo"** pill button, **Leads Summary** card (Group / Retail / Unclassified tabs, Quote/Policy/Proposal totals), **Quick Actions** row, a green **"Start on WhatsApp with TARA"** CTA, and a floating **TARA** chat bubble (bottom-right, present on every screen). | This is the entry point. The WhatsApp journey must be reachable from here exactly like this. |
| `image2.png` | "Get Your Quote" modal (Intermediary, Branch Details search, Retail/Group toggle, Pincode) with an inline **"✨ TARA SUGGESTS"** banner giving a contextual tip, then Continue. | Canonical shape of the reusable "TARA suggestion banner" component. |
| `image3.png` | The Leads list at route `/leads`, tab **Retail → Quotes**, showing a lead card for a WhatsApp-originated order: avatar initials, name, product/plan, **Order Id**, a **"✨ Created by TARA"** badge, chips **"WhatsApp · TARA"**, **"2 Adults + 1 Child"**, sum insured, **"45 fields prefilled"**, a list of attached document filenames, premium + timestamp, and a **"Fill proposal →"** action button. Right rail has a Filters panel. | This is the exact target shape of **Master Leads → Retail → Quote** after a WhatsApp order is created. Reproduce this card design and its copy conventions precisely. |
| `image5.png`, `image7.png` | Plan step: member/age selection, Sum Insured chips, Policy Period options with "Save ₹x" badges, "TARA SUGGESTS" recommending sum insured/tenure, product benefit list where every benefit row has an **"ASK TARA"** pill button, right-rail Premium Breakup, **"Create Proposal"** button. | Shows how TARA is woven into the plan/pricing screen without changing its layout. |
| `image10.png`, `image15.png`, `image20.png`, `image36.png` | Proposer steps (breadcrumb **KYC › Basic › Disclosures › Address › Bank**) and Insured steps (breadcrumb **Members › Nominee › Medical › Files**). Below empty required fields, a light-blue chip block labeled **"✨ TARA FOUND · WHATSAPP · TARA"** shows the value TARA extracted, with a **"✓ Use this"** button and a dismiss **"✕"** — the value is *never* auto-filled silently, the agent must click "Use this". Risk-relevant fields (mobile, email) carry a **"⚡ TARA SUGGESTS"** validation tip. | **This is the exact prefill mechanic to implement.** Prefill = a suggestion chip the agent explicitly applies, not a silently populated field. Reuse this one component everywhere a WhatsApp-sourced value could populate a form field. |
| `image30.png`, `image33.png` | Document upload step: upload dropzone with a "TARA SUGGESTS" tip about file size, a **"DOCUMENTS COLLECTED BY TARA"** panel listing files received over WhatsApp with size and a category tag (`ADD_PROOF`, `FORM_60`, `BANK_DETAILS`, `INCOME_PROOF`, all "Uploaded"), and a "Proposer Documents" confirmation grid. | Canonical shape of document association/status tracking (§14 of the requirements below). |
| `image38.png` | Review & Checkout: Sum Insured/Policy Period recap, Additional Covers with a TARA upsell banner, Payment Preference (Online / Cash-Cheque / Block-and-Pay via Bima-ASBA) with a TARA tip, Payment Type (Full Payment / Star EMI), Auto Renewal mandate checkbox, Premium Breakup, T&Cs checkbox gating a **"Pay Now"** button (disabled with a red hint until accepted). | Payment screen reference — unchanged by this project except for a milestone trigger on success. |
| `image40.png`, `image43.png`, `image44.png` | The **TARA assistant panel** (opens from the floating TARA button): header "TARA · ONLINE · TRUSTED AI FOR RELIABLE ASSISTANCE"; three tabs **"Ask TARA"**, **"Fill proposal"**, **"Help & FAQs"**; the Ask TARA tab has a greeting, quick-action chips (Generate Pitch, Benefits of Super Star, Network Hospitals near you, Medical Inflation in your area) and a free-text box "Ask TARA anything…"; milestone confirmations are posted as chat bubbles, e.g. *"🎉 Policy issued! Star Health Super Star for Sarang Soni is now active. Policy No: P/794365/01/2026/494392 · Sum Insured: ₹10 Lakh · Premium: ₹24,708. It has moved to **Leads › Policies**. The policy kit has been emailed to the customer."* | This is the one and only place milestone/status messages should render inside ATOM Pro — do not invent a new notification surface. |
| `image42.png` | An in-app **"What's new"** announcement modal, worded exactly as the target feature set: **"Start a proposal on WhatsApp"** — *"Share details by chat, voice note or a photo of the KYC documents — TARA now creates the order and prefills the ATOM PRO proposal form for you."* **"TARA now explains errors"** — *"If an upload or a form step fails, TARA reads the backend error log, tells you exactly what went wrong and gives you the fix — no more generic 'Something went wrong!'."* **"Live policy status updates"** — *"Payment success and policy issuance now ping you instantly on WhatsApp and here, and the case moves from Quotes → Proposals → Policies automatically."* CTA: **"Try the WhatsApp journey"**. | **This is effectively the product spec restated by the design itself.** Match this language in your own copy; treat "Quotes → Proposals → Policies" as the canonical tab names (plural), and "Try the WhatsApp journey" as the canonical entry CTA wording. |

The remaining screenshots fill in the connective steps between these anchors, in the same
top-to-bottom, left-to-right sequence. Skim all of them before building; do not guess at
layout you haven't looked at.

**These screenshots are evidence of the UI to preserve, not permission to redesign it.**

---

## 4. Primary business objective

An insurance agent can start a proposal from WhatsApp by sending information in any reasonable
format — one message, many messages, long paragraphs, short phrases, random order, voice
notes, documents/images/PDFs, a mix of all of the above, or information for several
customers/orders in the same conversation. TARA (the AI layer) must understand, organize,
validate, and map this into the existing ATOM Pro journey — creating an order that lands in
**Master Leads → Retail → Quotes**, ready for the agent to open and continue in the unchanged
proposal form, now prefilled.

---

## 5. Demo scope

Support exactly two products for the prototype: **Star Health Superstar** and **Assure**. Do
not hard-code the whole implementation around these two — build a product configuration layer
so more products can be added later without rearchitecting:

```
Product
├── required fields
├── optional fields
├── document requirements
├── validation rules
├── proposal mapping
└── payment / conversion flow
```

Use clearly recognizable demo/mock data throughout (see §17 for ID conventions). The prototype
must be end-to-end functional locally, with all external integrations mocked where a real
backend isn't available.

---

## 6. Core user journey

```
Agent
 ↓ WhatsApp
Select / identify insurance product
 ↓
Agent provides information (any format, any order, any number of messages)
 ↓
TARA structures the information, tracks confidence per field
 ↓
TARA identifies missing information → requests it, one or two things at a time
 ↓
TARA identifies contradictions / suspicious / ambiguous information → asks only when necessary
 ↓
Documents are received and associated with the correct customer
 ↓
Agent confirms the information
 ↓
Order is created  →  appears under Master Leads → Retail → Quotes  (image3.png pattern)
 ↓
Agent opens the quote  →  existing ATOM Pro proposal journey opens, unchanged
 ↓
Previously collected information appears as "TARA FOUND" suggestion chips (image10/15/20/36 pattern)
 ↓
Agent reviews / edits / accepts suggestions — the agent is always the final decision-maker
 ↓
TARA assists with in-context checks (image10/38 "TARA SUGGESTS" pattern)
 ↓
Proposal is submitted  →  moves to Master Leads → Retail → Proposals
 ↓
Payment (image38.png, unchanged)
 ↓
Policy conversion  →  moves to Master Leads → Retail → Policies, milestone posted in TARA panel
```

Two demos must each work standalone:
- **Demo A (straight path):** Quote → Proposal → Payment → Policy, started directly in ATOM Pro.
- **Demo B (WhatsApp path):** WhatsApp → OTP → TARA data collection → Order → Quote → existing
  ATOM Pro proposal (prefilled) → Payment → Policy, exactly as in §6.

---

## 7. WhatsApp is the starting point

The prototype's headline demo must start from the WhatsApp experience, not from the ATOM Pro
proposal page. Reuse the existing entry points already implied by the reference design — the
**"Start on WhatsApp with TARA"** button on the home dashboard (`image1.png`) and the **"Try
the WhatsApp journey"** CTA (`image42.png`) — as the launch points into a WhatsApp simulator.
The agent should never feel like they've jumped to an unrelated system; the transition into
ATOM Pro must feel like a continuation of the same conversation (see §13).

---

## 8. Authentication — strict requirement

The **only** authentication mechanism is OTP through ATOM Pro. Do not implement password
login, email/password, social login, a separate WhatsApp-only auth, PIN auth, or magic links
as an alternative path.

```
WhatsApp → agent identity request → ATOM Pro OTP → OTP verification → authenticated agent session → journey continues
```

Build a realistic mocked OTP service (`/mock/otpService`) if a real one isn't available. The
prototype must visibly show authentication state at every step, and must never silently bypass
auth "because it's a prototype."

---

## 9. The core design challenge: unpredictable agent input

Design specifically around agents not behaving like a form. Example of one customer's data
arriving fragmented across six separate messages, several of them one-liners, in no particular
field order (name+age+city+cover in message 1, family members in message 2, product in message
3, mobile in message 4, address in message 5, documents in message 6) — TARA must combine all
of it into one structured customer/application context, and never re-ask for something already
supplied earlier in the conversation, however it arrived.

### 9.1 Multiple orders in one conversation

An agent may provide two (or more) customers and products in the same conversation, in one
message or spread across many, e.g. *"Create Superstar for Rajesh age 42 Mumbai and Assure for
Priya age 34 Pune. Rajesh's number is 98xxxxxx12. I'll send documents for both."* TARA must
detect which information belongs to which customer/order and must never blindly merge separate
customers into one record. Model it explicitly:

```
Conversation
 ├── Order Candidate 1 → Customer, Product, Fields, Documents, Status
 ├── Order Candidate 2 → Customer, Product, Fields, Documents, Status
 └── ...
```

When ambiguous, TARA must ask, e.g.: *"I found information for two customers. Should the
Aadhaar document you just sent be linked to Rajesh Kumar or Priya Shah?"* Never silently
associate a document (or any field) with the wrong order when confidence is low.

### 9.2 Conversation intelligence

Convert unstructured messages into structured entities, e.g.:

```json
{
  "customer": { "name": "Rajesh Kumar", "age": 42, "city": "Mumbai", "mobile": "9876543210" },
  "product": "Superstar",
  "coverage": "1000000",
  "documents": []
}
```

Track, conceptually, per extracted field: `value`, `source` (e.g. "WhatsApp message #2"),
`confidence`, `status` (e.g. "verified"). This doesn't need to be visibly exposed to the agent
end-to-end, but the data model must support it — it's what powers the "TARA FOUND ·
WHATSAPP · TARA" chips in the reference screenshots.

### 9.3 Never re-ask for known information

TARA must maintain persistent conversation context per order candidate and must never ask for
a field that has already been supplied in an earlier message, regardless of format.

### 9.4 Missing information — progressive, not overwhelming

Identify missing mandatory fields but ask for them a little at a time, prioritized by what's
actually needed to progress — never a 15-question dump. e.g.: *"I have most of Rajesh's
details. I still need his date of birth to continue. Please share it in any format."* → later:
*"Thanks. I also need the nominee details."*

### 9.5 Data validation

Flag obvious mistakes without inventing business rules that aren't backed by the product
config (mark anything invented as a clearly-labeled configurable demo rule):
- **Age vs DOB mismatch** — stated age vs. a document's DOB disagree → *"I found a mismatch
  between the stated age and the date of birth in the document. Please verify before
  continuing."*
- **Invalid mobile number** → *"The mobile number appears to be incomplete. Please verify it."*
- **Invalid pincode** → *"The pincode appears to be invalid. Please check it."*
- **Duplicate customer** — same person already has an active order → *"Rajesh Kumar appears to
  already have an existing order. Please confirm whether this is a new proposal or an existing
  one."*

### 9.6 Document handling

Agents may send Aadhaar, PAN, passport, other ID, medical documents, product-specific
documents, images, PDFs. TARA should: detect the document type; extract relevant information
where practical (mock this if no real OCR is available — never claim a document was processed
when it wasn't); associate the document with the correct customer/order; flag when a document
looks unrelated to the stated customer; ask for clarification when needed; track document
status per customer (mirror the `image30.png` pattern: filename, size, category tag, status).

### 9.7 Document-to-customer association

*"Here's Rajesh's Aadhaar"* → associate with Rajesh, no ambiguity. A bare upload with no
explanation, and more than one active customer in the conversation, must never be guessed —
TARA must ask: *"I found multiple active customers in this conversation. Which customer does
this document belong to?"* — with a simple selection UI.

### 9.8 Corrections, not duplicates

If the agent later corrects a previously given value (*"Actually Rajesh is 45"*), update the
existing field/record — never create a second, conflicting record for the same order.

### 9.9 Audio input

```
🎙️ voice message received → transcribing (mocked STT if unavailable) → AI extraction → structured fields
```

Confirm what was understood, e.g.: *"I understood: 'Rajesh Kumar, 42 years old, Mumbai,
Superstar.'"* — with a confirm option where useful. The architecture must demonstrate the
correct flow even if transcription itself is mocked.

---

## 10. TARA — role and integration surface

TARA augments ATOM Pro; it never replaces it. Inside WhatsApp, TARA understands messages,
extracts fields, identifies missing/conflicting/incorrect information, associates documents,
tracks progress, and recommends next steps. Once the agent enters the existing ATOM Pro
proposal journey, TARA provides contextual assistance **without changing the existing UI**, by
reusing exactly the components already present in the reference design:

- **"TARA SUGGESTS" banner** — a contextual tip or validation warning, e.g. *"Please check the
  nominee relationship field before continuing."* / *"All mandatory fields appear complete.
  You can proceed to review and submit."*
- **"TARA FOUND · WHATSAPP · TARA" chip with "Use this"** — offers a WhatsApp-sourced value for
  one field; the agent applies or dismisses it explicitly. Never auto-fill silently.
- **"ASK TARA" pill** — inline on plan/cover rows, opens the TARA panel scoped to that topic.
- **The TARA side panel** (`image40/43/44.png`) — Ask TARA / Fill proposal / Help & FAQs tabs;
  this is where milestone messages post.

Use whichever of these least-intrusive patterns fits the field in question. Do not invent a
new assistant surface, and do not redesign the proposal form to make room for TARA.

---

## 11. Prefill requirement

```
WhatsApp information → structured customer data → ATOM Pro order → existing proposal form → "TARA FOUND" suggestion chips
```

The agent must always be able to edit fields normally, and must never be locked into an
AI-generated value. Prefill = offered, not imposed. The agent remains in control.

---

## 12. Milestone notifications

TARA/WhatsApp must notify the agent at each milestone, posted as TARA-panel chat bubbles (and
mirrored to the WhatsApp simulator), for Star Health at minimum:

1. **Order Created** — ✅ *Order created successfully for Rajesh Kumar. Order ID: ORD-10023.
   You can now continue with the proposal in ATOM Pro.*
2. **Proposal Created** — ✅ *Proposal created successfully. Proposal ID: PROP-10023. The
   proposal is now available under Master Leads → Retail → Proposals.*
3. **Payment Completed** — ✅ *Payment completed successfully. Payment reference: PAY-10023.*
4. **Policy Converted** — 🎉 *Policy converted successfully. Policy number: POL-10023. The
   policy is now available under Master Leads → Retail → Policies.* (mirrors the exact copy
   pattern already shown in `image40.png`)

Use realistic, clearly demo-generated identifiers (see §17).

---

## 13. Status synchronization

One underlying application state — never disconnected WhatsApp vs. ATOM Pro states.

```
Order
├── id, customer, product, documents, timestamps
├── quote_status
├── proposal_status
├── payment_status
└── policy_status
```

Example progression: `ORDER_CREATED → QUOTE_CREATED → PROPOSAL_IN_PROGRESS →
PROPOSAL_CREATED → PAYMENT_PENDING → PAYMENT_SUCCESS → POLICY_CONVERTED`. WhatsApp and ATOM Pro
both read from this same logical state — this is what drives the Master Leads tab an order
sits under (§14) and the "N fields prefilled" / "Created by TARA" badges seen in `image3.png`.

The transition into ATOM Pro must preserve agent identity, order ID, customer, product,
prefilled data, and journey state — the agent should never have to search manually for the
quote WhatsApp just created; land them directly on it (mirroring the "Fill proposal →" CTA in
`image3.png`).

---

## 14. Master Leads behavior

```
Master Leads
└── Retail
     ├── Quotes
     ├── Proposals
     └── Policies
```

Movement: order created → **Quotes**; proposal created → **Proposals**; policy converted →
**Policies**. Reuse the tab structure, filter panel, and lead-card design already shown in
`image3.png` — don't build a parallel leads UI for WhatsApp-originated orders.

---

## 15. AI extraction architecture

Keep AI interpretation and business logic strictly separate — the LLM must never directly
mutate critical business state.

```
WhatsApp Message
 ↓ Message Normalization
 ↓ AI Intent / Entity Extraction
 ↓ Structured Candidate Data   (schema-validated, see below)
 ↓ Validation Engine
 ↓ Conversation State Manager
 ↓ Order Builder
 ↓ ATOM Pro Integration
```

Structured output schema (validate against a schema; never depend on free-form LLM text for
application logic):

```json
{
  "intent": "CREATE_OR_UPDATE_ORDER",
  "product": { "value": "Superstar", "confidence": 0.97 },
  "customers": [
    { "customer_id": null, "name": "Rajesh Kumar", "dob": null, "age": 42,
      "mobile": "9876543210", "city": "Mumbai" }
  ],
  "documents": [],
  "missing_fields": ["date_of_birth"],
  "ambiguities": [],
  "suggested_action": "REQUEST_MISSING_FIELD"
}
```

A deterministic business layer decides which actions are actually permitted from this output —
the AI proposes, the business layer disposes.

---

## 16. Confidence and human control

Where extraction confidence is below threshold, ask for confirmation rather than guessing:
*"I think you said the customer's name is 'Rahul Sharma', but I'm not fully sure. Please
confirm."* Never silently create an incorrect record.

---

## 17. Idempotency, IDs, and demo data conventions

Prevent duplicate orders, duplicate document uploads, duplicate message processing, duplicate
payment records, duplicate policy conversion, and duplicate milestone notifications — use
idempotency keys, message IDs, order/proposal/payment IDs consistently.

Use clearly demo-labeled identifiers, e.g.:

```
Order ID:    ORD-DEMO-1001
Quote ID:    QUO-DEMO-1001
Proposal ID: PROP-DEMO-1001
Payment ID:  PAY-DEMO-1001
Policy ID:   POL-DEMO-1001
```

Isolate mock services so they can later be swapped for real integrations without touching the
rest of the app:

```
/mock
  orderService
  proposalService
  paymentService
  policyService
  otpService
  whatsappService
  documentService
```

Never hard-code a "successful" result directly into a UI component — always go through a mock
service, even a trivial one, so the seam for a future real integration is visible.

---

## 18. Error handling

Design graceful recovery, never a raw technical error, for: an unparseable message (*"I
couldn't understand that information. Could you provide the customer's name and product?"*), a
missing field, conflicting data across messages (*"I found two different mobile numbers for
Rajesh. Which one should I use?"*), an unrecognized document type, ATOM Pro being unavailable
(*"ATOM Pro is temporarily unavailable. Your information is saved and can be resumed."*), and
payment failure (*"Payment was not completed. Your proposal is saved and you can retry payment
from ATOM Pro."*). This mirrors the "TARA now explains errors" feature already described in
`image42.png` — TARA should read the underlying failure and explain it, never surface a bare
"Something went wrong."

---

## 19. Design principles and priority order

Progressive disclosure, minimal cognitive load, always-clear system status, error prevention
(especially around document/customer association), easy recovery/correction without restarting
the journey, one consistent feel across WhatsApp/TARA/ATOM Pro, human-in-the-loop (AI assists,
the agent decides), and clear visual distinction between AI-extracted, agent-confirmed, and
system-generated data.

When requirements conflict, resolve in this order:

```
Accuracy > Existing UI preservation > Seamless integration > Human control > Error prevention > Good UX > Technical elegance
```

Never sacrifice existing ATOM Pro proposal design for the sake of the WhatsApp experience.

---

## 20. WhatsApp UI design

Design specifically for unpredictable human behavior — this should feel conversational, fast,
forgiving, context-aware, minimal, and professional, not like a rigid form. Use buttons/cards
only where they materially reduce ambiguity (e.g. selecting between two candidate customers);
natural language stays the primary interaction. Example pattern for multi-customer resolution:
*"I found 2 customers: 1. Rajesh Kumar — Superstar 2. Priya Shah — Assure. Which one should I
update?"*

---

## 21. Conversation state machine

```
NEW_CONVERSATION → AUTHENTICATION_REQUIRED → AUTHENTICATED → COLLECTING_INFORMATION →
PROCESSING_DOCUMENTS → AWAITING_CLARIFICATION → READY_FOR_ORDER → ORDER_CREATED →
QUOTE_CREATED → ATOM_PRO_PROPOSAL → PROPOSAL_CREATED → PAYMENT → POLICY_CONVERTED
```

The conversation must be able to move backwards when information needs correction (e.g. agent
corrects a DOB after proposal creation → relevant fields update → proposal state becomes
"Needs Review") — never a rigid one-way flow that breaks when the agent changes their mind.

---

## 22. Security principles

This is an insurance application — apply real security discipline even in a prototype:
authentication, authorization, session management, secure API communication, input validation,
document access control, data minimization, auditability, idempotency, secure storage, and
error handling that never leaks sensitive information. Clearly label which security pieces are
mocked vs. production-shaped.

---

## 23. Suggested API surface

Reuse the application's existing APIs first where they already exist; only add new endpoints
where genuinely needed — don't build these just because they're listed here:

```
POST /auth/otp/request
POST /auth/otp/verify
POST /whatsapp/messages
POST /whatsapp/documents
POST /conversations/{id}/process
POST /orders            GET /orders/{id}
POST /quotes            GET /quotes/{id}
POST /proposals         GET /proposals/{id}
POST /payments          GET /payments/{id}
POST /policies          GET /policies/{id}
```

---

## 24. Event-driven milestones and auditability

Model milestones as events (`ORDER_CREATED`, `QUOTE_CREATED`, `PROPOSAL_CREATED`,
`PAYMENT_COMPLETED`, `POLICY_CONVERTED`) that fan out to an ATOM Pro state update, a WhatsApp
notification, and a TARA panel status update, so all three stay in sync. Maintain a visible
activity timeline per order, e.g.:

```
21:01 — Agent authenticated
21:03 — Customer information received
21:04 — Aadhaar uploaded
21:05 — Customer details validated
21:06 — Order created
21:06 — Quote created
21:07 — Agent opened ATOM Pro
21:09 — Proposal created
21:10 — Payment completed
21:11 — Policy converted
```

---

## 25. Claude Code working method

**Step 1 — Inspect.** Since the repo is currently empty, "inspecting the existing app" means
studying every file in `docs/reference-screenshots/` and this document closely before writing
any code. If, later in this project, ATOM Pro screens already exist in the repo from earlier
work, inspect and reuse *those* instead of re-deriving them from screenshots.

**Step 2 — Map.** Before building, write a short implementation map: what will be built for
the ATOM Pro reference UI, what's genuinely new (WhatsApp simulator, TARA orchestration,
mocks), and what's explicitly out of scope for this prototype.

**Step 3 — Protect existing functionality.** Once the ATOM Pro screens exist, avoid touching
their behavior beyond what integration genuinely requires.

**Step 4 — Implement the smallest clean extension.** Build the WhatsApp orchestration layer
around the ATOM Pro app, not through it.

**Step 5 — Connect state.** Make sure WhatsApp, ATOM Pro, and Master Leads all reflect the same
underlying order/proposal/payment/policy state (§13).

**Step 6 — Test all scenarios.** Both happy paths and the messy real-world scenarios in §26.

**Coding rule:** this is a prototype — do not prematurely refactor, do not chase architectural
perfection at the expense of working functionality, keep changes targeted and maintainable.

---

## 26. Scenarios to demonstrate

1. **Simple order** — *"Need Superstar for Rajesh Kumar age 42 Mumbai 10 lakh cover."* → extract,
   identify missing mandatory fields, create order, move to Quotes, hand off into ATOM Pro.
2. **Multiple messages** — same customer's info spread across 5–10 separate messages, merged
   correctly.
3. **Random order of information** — city, product, mobile, name, age, and a "PAN sending
   next" note arriving in scrambled order, still resolving to one correct customer record.
4. **Multiple customers** in one conversation → separate order candidates, never merged.
5. **Multiple products** — e.g. Rajesh→Superstar, Priya→Assure, correctly associated.
6. **Documents sent after text** — correctly associated to the right order.
7. **Ambiguous document** — with 2+ active customers, TARA asks which one it belongs to.
8. **Correction, not duplication** — *"Rajesh age 42"* then later *"Actually Rajesh is 45"*
   updates the existing record.
9. **AI-detected mismatch** — document DOB vs. stated age disagree → TARA warns.
10. **Straight journey** — Quote → Proposal → Payment → Policy, started in ATOM Pro directly.
11. **Full WhatsApp journey** — WhatsApp → Quote → Proposal → Payment → Policy end to end.

### Test cases to implement
Single-message customer creation · multi-message customer creation · random-order information ·
multiple customers · multiple products · missing information · conflicting information ·
duplicate customer · duplicate message · duplicate document · ambiguous document · incorrect
mobile number · invalid date of birth · audio transcription · order creation · quote creation ·
proposal creation · payment success · payment failure · policy conversion · ATOM Pro
unavailable · resume an interrupted conversation · agent edits a prefilled field · TARA
identifies a potential proposal error · milestone notifications fire correctly.

---

## 27. Acceptance criteria

- **ATOM Pro:** existing proposal UI is visually and functionally unchanged (once built to
  match the reference) and remains fully usable; WhatsApp-collected information can prefill it
  via the "TARA FOUND / Use this" pattern only — never silently.
- **WhatsApp:** free-form text, multiple messages, simulated audio, document uploads, multiple
  customers, multiple products, and ambiguity resolution all work; TARA understands context,
  detects missing/conflicting information, and gives meaningful milestone updates.
- **Authentication:** OTP via ATOM Pro is the only method; auth state persists through the
  whole journey.
- **Leads:** created orders appear under Master Leads → Retail → Quotes; proposal creation
  moves them to Proposals; policy conversion moves them to Policies.
- **End-to-end:** WhatsApp → OTP → customer input → AI interpretation → document handling →
  Order → Quote → existing ATOM Pro proposal → Proposal creation → Payment → Policy conversion
  all work as one connected run.

---

## 28. Final deliverable

At the end of implementation, provide:

- **A. Working prototype** — runs locally end to end.
- **B. Architecture summary** — brief explanation of what was actually built.
- **C. Files changed** — list of important files created/modified.
- **D. Demo credentials** — mock OTP / user / demo credentials needed to run it.
- **E. Demo scenarios** — exact steps for: (1) Quote → Proposal → Payment → Policy; (2)
  WhatsApp → Quote → Proposal → Payment → Policy; (3) multiple customers in one WhatsApp
  conversation; (4) document + AI validation.
- **F. Known limitations** — explicitly what's mocked vs. what would need to be real for
  production.

---

## 29. The one instruction to hold above all others

The goal is **not** to redesign ATOM Pro. The goal is to use AI + WhatsApp to intelligently
collect, structure, validate, and prefill information, then hand the agent seamlessly into the
existing, unchanged ATOM Pro proposal journey. The experience should feel like one connected
system:

```
WhatsApp → "TARA understands what the agent means" → "ATOM Pro already knows the customer"
→ "Agent reviews the existing proposal" → "Payment" → "Policy"
```

Never modify the existing ATOM Pro proposal design for the sake of implementing the WhatsApp
experience.
