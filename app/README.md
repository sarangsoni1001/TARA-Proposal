# WhatsApp → TARA → ATOM Pro Prefilled Proposal Journey — Prototype

A working, local, end-to-end prototype built from [`../PROMPT.md`](../PROMPT.md). It
demonstrates an insurance agent starting a Star Health proposal from a WhatsApp
conversation with an unpredictable, free-form input style, with TARA (a mocked
AI layer) structuring that conversation into an ATOM Pro order that prefills the
(re-created, unmodified-going-forward) ATOM Pro proposal journey through to
payment and policy issuance.

## A. Running it locally

```bash
npm install
npm run dev      # starts the app at http://localhost:5173
npm test         # runs the extraction/state-machine unit tests
npm run build    # production build + typecheck
```

No environment variables, API keys, or backend are required — everything (OTP,
WhatsApp, document OCR, payment, policy issuance) is mocked in-process. State
is kept in a Zustand store persisted to `localStorage`, so a page refresh keeps
whatever orders/leads you've created; use your browser's "clear site data" (or
an incognito window) to reset the demo to a clean slate.

## B. Architecture summary

```
src/
  types/           Domain types shared across the app (Order, Quote, Proposal,
                    Payment, Policy, Conversation, ExtractedField, …)
  data/products.ts  Product configuration layer (Superstar, Assure) — required
                    fields, documents, sum-insured/tenure options, premium
                    formula. Adding a third product means adding a config
                    entry here, not touching the wizard or the AI layer.
  ai/
    extraction.ts    The "AI interpretation layer" — a rule-based, demo-grade
                      NLU that turns one WhatsApp message into a structured
                      ExtractionResult. No network calls, no model — see
                      "Known limitations" below. Pure functions, no store
                      access.
    orchestrator.ts  The deterministic "business layer" (PROMPT.md §15): takes
                      an ExtractionResult and decides how it changes an
                      OrderCandidate — field merging with source/confidence/
                      status tracking, missing-field computation, validation
                      (age/DOB mismatch, mobile, pincode), duplicate-customer
                      detection, and what TARA says next. Pure functions, unit
                      tested in *.test.ts next to each module.
  store/
    useAppStore.ts   Zustand store: conversations, order candidates, quotes,
                      proposals, payments, policies, documents. Every mutation
                      (send message, upload document, accept a prefilled
                      field, create an order, pay) is a store action; this is
                      also where AI output gets applied to state and where
                      idempotency (duplicate message/document detection) and
                      the milestone notifications live.
    useUiStore.ts    Small UI-only store (TARA panel open state, active
                      conversation, "What's new" dismissal).
  components/
    shell/           Header, Sidebar, floating TARA button, the TARA side
                      panel (Ask TARA / Fill proposal / Help & FAQs), the
                      "What's new" announcement modal.
    shared/           Reusable pieces used across ATOM Pro screens:
                      TaraSuggestsBanner, TaraWarningBanner, PrefillChip +
                      FieldWithPrefill (the "TARA FOUND · WHATSAPP · TARA /
                      Use this" mechanic), DocumentsPanel.
  pages/
    Home.tsx          ATOM Pro dashboard (Leads Summary, Quick Actions, entry
                      points into both demo journeys).
    QuoteNew.tsx      "Get Your Quote" modal + Plan/pricing step (straight
                      path entry point).
    Proposal.tsx      Proposer (KYC/Basic/Disclosures/Address/Bank) + Insured
                      (Members/Nominee/Medical/Files) wizard, reusing
                      FieldWithPrefill everywhere a WhatsApp-sourced value
                      could prefill a field.
    Checkout.tsx      Review & Checkout, payment, and the policy-issued
                      confirmation screen.
    Leads.tsx         Master Leads → Retail → Quotes/Proposals/Policies.
    WhatsApp.tsx      The WhatsApp simulator: OTP gate, chat transcript,
                      demo-script buttons for every PROMPT.md §26 scenario,
                      simulated voice notes and document attachments, and a
                      live per-customer progress panel.
```

Conceptually this matches the layered architecture in `PROMPT.md` §15/§43:

```
WhatsApp message → extraction.ts (AI layer, pure)
                 → useAppStore._applyExtraction (business/state layer)
                 → orchestrator.ts (merge, validate, decide TARA's reply)
                 → OrderCandidate state → Order/Quote → Proposal → Payment → Policy
```

The AI layer never mutates state directly — it only returns data. The store
decides what's actually allowed to happen with it (confidence/idempotency/
duplicate rules), matching the "never let the LLM directly mutate critical
business state" requirement.

## C. Files changed / added

Everything under `app/` is new (the repository had no application code before
this prototype). The reference screenshots and the build brief itself live at
the repo root: `../PROMPT.md`, `../docs/reference-screenshots/`.

## D. Demo credentials

- **Agent identity**: hardcoded as "Prakash Babu L" for the prototype (matches
  the reference screenshots).
- **OTP**: any WhatsApp conversation's OTP gate accepts the fixed demo code
  **`123456`**. The chat also echoes this code in a system message when you
  request the OTP, so nothing needs to be memorized to demo it.
- No other login is implemented — per `PROMPT.md` §8, OTP via ATOM Pro is the
  only authentication path.

## E. Demo scenarios — exact steps

### Demo 1 — Straight path: Quote → Proposal → Payment → Policy
1. From Home, click **Quick Quote** (or the "Or start the straight path" banner).
2. Enter pincode `400081` → **Continue**.
3. Pick a product, adjust sum insured/tenure if you like → **Create Proposal**.
4. Walk through Proposer (KYC → Basic → Disclosures → Address → Bank) and
   Insured (Members → Nominee → Medical → Files), filling fields normally →
   **Review & Checkout** → **Pay Now**.
5. You land on the policy-issued confirmation. Open **Leads** → Retail →
   Policies to see it there.

### Demo 2 — WhatsApp → Quote → Proposal → Payment → Policy
1. From Home, click **Start on WhatsApp with TARA** (or the "WhatsApp × TARA"
   banner, or the header's **WhatsApp demo** pill).
2. Click **Send OTP to verify agent**, then enter `123456` → **Verify**.
3. Use the **Demo scripts** panel on the left — click *"Superstar for Rajesh,
   42, Mumbai, 10L"*, then answer TARA's follow-up prompts (date of birth,
   mobile, etc. — typed free-form) until TARA offers **Create Order**.
4. Click **Create Order**, then **Continue in ATOM Pro** on the confirmation
   card. You land directly on the prefilled proposal.
5. Open any step (e.g. Proposer → Bank) to see **"TARA FOUND · WHATSAPP ·
   TARA"** suggestion chips — click **Use this** to pull the value into the
   field, exactly like the reference screenshots. Finish the wizard and pay.
6. Watch the floating **TARA** panel (bottom-right) — the "Order created" /
   "Proposal created" / "Payment completed" / "Policy issued" milestones post
   there as they happen, and the Leads tab the record sits under updates live
   (Quotes → Proposals → Policies).

### Demo 3 — Multiple customers in one WhatsApp conversation
1. Start a WhatsApp conversation and authenticate as above.
2. Click the demo script *"Rajesh–Superstar & Priya–Assure"* (sends: *"Create
   Superstar for Rajesh age 42 Mumbai and Assure for Priya age 34 Pune.
   Rajesh's number is 9876543210. I'll send documents for both."*).
3. The right-hand panel splits into two separate order cards, each with its
   own correct product. Continue with the other scenario buttons (family
   details, mobile, address) to see fragments attach to the most relevant
   open customer.
4. Click the paperclip icon and choose **"Unlabelled scan (ambiguous)"** — TARA
   asks *"Which customer does this document belong to?"* with a button per
   customer, rather than guessing.

### Demo 4 — Document + AI validation
1. In a WhatsApp conversation with one active customer, use the paperclip
   picker to send Aadhaar / PAN / cheque / salary-slip demo documents — each
   attaches automatically and shows up under "Documents collected by TARA" in
   the corresponding proposal's Files step.
2. Click **"Conflicting DOB"** in the demo scripts after establishing an age —
   TARA flags the age/DOB mismatch and blocks progress until it's resolved.
3. Click **"Actually Rajesh is 45"** to see a correction update the existing
   record in place (no duplicate customer is created), and the mismatch
   message updates to reflect the corrected value.
4. Use **"Scenario · Resend last message (duplicate test)"** twice in a row —
   the second send is recognized as a duplicate and produces no new state
   change.

## F. Known limitations (mocked vs. production-shaped)

- **AI extraction (`ai/extraction.ts`) is a rule-based heuristic, not a real
  LLM call.** It's tuned to the phrasing in the demo scripts and the PROMPT.md
  scenario text; it will misparse phrasing that differs meaningfully from
  those patterns (e.g. street addresses beyond "Address is X, pincode"). A
  production build swaps this module for a real extraction call behind the
  same `ExtractionResult` contract — nothing else in the app depends on how
  the structured data was produced.
- **Follow-up fragments in a multi-customer conversation attach to the most
  recently active customer when the fragment doesn't name anyone** (e.g. "Wife
  Sunita 38..." right after two customers are open). A production build would
  likely have TARA ask which customer a genuinely ambiguous fragment belongs
  to, the same way it already does for documents — this prototype optimizes
  for not interrupting the agent on every line.
- **Speech-to-text and document OCR are both mocked.** Voice notes are
  "transcribed" by literally using the text you type into the simulated
  recorder; documents are recognized by filename only (`classifyDocumentFileName`),
  never their actual content.
- **OTP, payment, and policy issuance are mocked services with no real
  gateway.** Payment always succeeds; policy issuance is chained immediately
  after payment for demo speed (the reference screenshots show near-instant
  issuance for this product).
- **The Proposer/Insured wizard covers the fields shown in the reference
  screenshots, not the full real ATOM Pro field set** (e.g. KYC/Disclosures
  are simplified; there is a single address block rather than separate
  communication/permanent-KYC addresses).
- **No backend/persistence beyond `localStorage`.** This is a client-only
  prototype; there's no server, database, or multi-user session.
- Security items in `PROMPT.md` §22 (secure storage, auditability, access
  control) are represented at the level appropriate to a local prototype (an
  in-memory/localStorage store, a visible audit timeline per order) rather
  than production-hardened.
