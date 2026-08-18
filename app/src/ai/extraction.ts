import { detectProductFromText } from '@/data/products'
import type { ExtractedCustomer, ExtractedDocumentRef, ExtractionResult } from '@/types'

/**
 * Heuristic, rule-based "AI interpretation layer" (PROMPT.md section 15).
 *
 * This is a DEMO-GRADE mocked NLU, not a real LLM call — there is no model
 * behind it. It exists so the prototype can be exercised end-to-end without
 * external API access. It is intentionally narrow: it targets the phrasing
 * used in the shipped demo scripts (see README "Known limitations"). A real
 * build would swap this module for an actual LLM extraction call behind the
 * same ExtractionResult contract — nothing downstream depends on how the
 * structured data was produced.
 */

const KNOWN_CITIES = [
  'mumbai', 'pune', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'hyderabad',
  'kolkata', 'ahmedabad', 'surat', 'jaipur', 'lucknow', 'nagpur', 'indore',
  'mulund west', 'mulund', 'thane', 'navi mumbai', 'noida', 'gurgaon', 'gurugram',
]

const RELATIONSHIP_WORDS: Record<string, string> = {
  wife: 'Spouse',
  husband: 'Spouse',
  spouse: 'Spouse',
  son: 'Son',
  daughter: 'Daughter',
  mother: 'Mother',
  father: 'Father',
  brother: 'Brother',
  sister: 'Sister',
}

const OCCUPATION_WORDS = ['business', 'trader', 'salaried', 'professional', 'self-employed', 'self employed', 'service']

const STOPWORDS = new Set([
  'need', 'insurance', 'for', 'cover', 'age', 'years', 'mobile', 'is', 'sending', 'send',
  'address', 'and', 'the', 'a', 'an', 'my', 'his', 'her', 'their', 'i', 'll', 'ill',
  'next', 'lakh', 'lakhs', 'documents', 'aadhaar', 'pan', 'photo', 'sir', 'wife', 'son',
  'daughter', 'husband', 'mother', 'father', 'spouse', 'create', 'customer', 'first',
  'another', 'second', 'number', 'attaching', 'attached', 'yrs', 'yr', 'old',
  // Domain acronyms/abbreviations — these are ALL-CAPS but still match `[A-Z][a-zA-Z]*`
  // (only the first letter is required to be uppercase), so without this list a phrase
  // like "His DOB is 15/03/1970" mistakes "DOB" itself for the customer's name.
  'dob', 'pan', 'kyc', 'ifsc', 'otp', 'sp', 'pin', 'ped', 'eia', 'gst', 'emi',
  // Correction/discourse markers — sentence-initial so they're capitalized, but they are
  // never a customer's name (e.g. "Actually Rajesh is 45" must resolve to "Rajesh").
  'actually', 'correction', 'correct', 'update', 'wait', 'no', 'sorry', 'also',
])

function titleCaseWords(text: string): string[] {
  return text
    .split(/\s+/)
    .filter((w) => /^[A-Z][a-zA-Z.]*$/.test(w) && !STOPWORDS.has(w.toLowerCase()))
}

/**
 * Finds "<Name> - Product" / "<Name> for Product" / "Product for <Name>" style pairs.
 *
 * Deliberately NOT case-insensitive on the name portion: `[A-Z]` is what tells a real
 * proper noun (e.g. "Rajesh") apart from an ordinary word that happens to sit next to
 * "Superstar"/"Assure" in the sentence (e.g. "Create Superstar for Rajesh age 42 Mumbai
 * and Assure for Priya" — without case-sensitivity this also matches "Create", "Mumbai
 * and", and "age" as bogus "names"). Only the product word itself is matched in either case.
 */
function extractNameProductPairs(text: string): { name: string; product: 'SUPERSTAR' | 'ASSURE' }[] {
  const pairs: { name: string; product: 'SUPERSTAR' | 'ASSURE' }[] = []
  const nameWord = '[A-Z][a-z]+'
  const productWord = '(?:Superstar|superstar|SUPERSTAR|Assure|assure|ASSURE)'
  const patterns = [
    new RegExp(`(${nameWord}(?:\\s${nameWord})?)\\s*(?:-|:|,)?\\s*(?:for)?\\s*(${productWord})`, 'g'),
    new RegExp(`(${productWord})\\s+for\\s+(${nameWord}(?:\\s${nameWord})?)`, 'g'),
  ]
  for (const re of patterns) {
    const nameIsSecondGroup = re.source.startsWith(`(${productWord}`)
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      const [a, b] = nameIsSecondGroup ? [m[2], m[1]] : [m[1], m[2]]
      const product = /superstar/i.test(b) ? 'SUPERSTAR' : 'ASSURE'
      const name = a.trim()
      if (STOPWORDS.has(name.toLowerCase().split(' ')[0])) continue
      if (name.split(' ').length <= 3 && !pairs.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
        pairs.push({ name, product })
      }
    }
  }
  return pairs
}

function extractMobile(text: string): string | undefined {
  const m = text.match(/\b(\d{10})\b/)
  return m ? m[1] : undefined
}

function extractEmail(text: string): string | undefined {
  const m = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
  return m ? m[0] : undefined
}

function extractPincode(text: string): string | undefined {
  const m = text.match(/\b(\d{6})\b/)
  return m ? m[1] : undefined
}

function extractDob(text: string): string | undefined {
  const m = text.match(/\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/)
  return m ? m[1] : undefined
}

function extractAge(text: string, excludeNumbers: Set<string>): number | undefined {
  const explicit = text.match(/\bage[d]?\s*(\d{1,2})\b/i) || text.match(/\b(\d{1,2})\s*(?:years?|yrs?)(?:\s*old)?\b/i)
  if (explicit) return Number(explicit[1])
  // Bare 1-2 digit standalone number, plausible as a human age, and not already
  // claimed as part of a mobile/pincode/DOB match.
  const bare = text.match(/(?<![\d/-])\b(\d{1,2})\b(?![\d/-])/)
  if (bare && !excludeNumbers.has(bare[1]) && Number(bare[1]) >= 1 && Number(bare[1]) <= 99) {
    return Number(bare[1])
  }
  return undefined
}

const KNOWN_CITIES_BY_LENGTH_DESC = [...KNOWN_CITIES].sort((a, b) => b.length - a.length)

function extractCity(text: string): string | undefined {
  const lower = text.toLowerCase()
  // Longest match first so "Mulund West" wins over the "Mumbai" that also appears in the
  // same address, rather than whichever city happens to sit first in KNOWN_CITIES.
  for (const city of KNOWN_CITIES_BY_LENGTH_DESC) {
    if (lower.includes(city)) {
      return city.replace(/\b\w/g, (c) => c.toUpperCase())
    }
  }
  return undefined
}

/** Every recognized city token anywhere in the text, not just the primary `extractCity` pick — used to
 * stop e.g. "Mumbai" in "Mulund West, Mumbai" from being mistaken for a person's name. */
function allKnownCityWords(text: string): string[] {
  const lower = text.toLowerCase()
  const words: string[] = []
  for (const city of KNOWN_CITIES) {
    if (lower.includes(city)) words.push(...city.split(' '))
  }
  return words
}

function extractSumInsured(text: string): number | undefined {
  const m = text.match(/(\d+(?:\.\d+)?)\s*lakh/i)
  if (m) return Math.round(Number(m[1]) * 100000)
  return undefined
}

function extractOccupation(text: string): string | undefined {
  const lower = text.toLowerCase()
  const found = OCCUPATION_WORDS.find((w) => lower.includes(w))
  return found ? found.replace(/\b\w/g, (c) => c.toUpperCase()) : undefined
}

function extractName(text: string, alreadyKnown: string[]): string | undefined {
  const knownLower = new Set(alreadyKnown.map((w) => w.toLowerCase()))
  const candidates = titleCaseWords(text).filter((w) => !knownLower.has(w.toLowerCase()))
  if (candidates.length === 0) return undefined
  // Greedily join consecutive capitalized tokens into a single name.
  const idx = text.split(/\s+/).findIndex((w) => w === candidates[0])
  const words = text.split(/\s+/)
  const nameParts: string[] = []
  for (let i = idx; i < words.length && i < idx + 3; i++) {
    const clean = words[i].replace(/[.,]$/, '')
    if (/^[A-Z][a-zA-Z]*$/.test(clean) && !STOPWORDS.has(clean.toLowerCase()) && !knownLower.has(clean.toLowerCase())) {
      nameParts.push(clean)
    } else break
  }
  return nameParts.length ? nameParts.join(' ') : undefined
}

function extractFamilyMembers(text: string): { relationship: string; name: string; age: number }[] {
  const out: { relationship: string; name: string; age: number }[] = []
  const re = /(wife|husband|son|daughter|mother|father|spouse)\s+([A-Z][a-zA-Z]+)\s+(\d{1,2})/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    out.push({ relationship: RELATIONSHIP_WORDS[m[1].toLowerCase()] ?? m[1], name: m[2], age: Number(m[3]) })
  }
  return out
}

function extractDocumentMentions(text: string): ExtractedDocumentRef[] {
  const docs: ExtractedDocumentRef[] = []
  const lower = text.toLowerCase()
  const mentionFor = (label: string, category: ExtractedDocumentRef['category']) => {
    if (!lower.includes(label)) return
    const m = text.match(new RegExp(`([A-Z][a-zA-Z]+)['’]s\\s+${label}`, 'i'))
    docs.push({
      fileName: `${label.replace(/\s+/g, '_')}_shared_via_whatsapp`,
      sizeLabel: '—',
      category,
      mentionedCustomerName: m ? m[1] : undefined,
    })
  }
  mentionFor('aadhaar', 'ADD_PROOF')
  mentionFor('pan', 'FORM_60')
  mentionFor('salary slip', 'INCOME_PROOF')
  mentionFor('cancelled cheque', 'BANK_DETAILS')
  return docs
}

export function extractFromMessage(text: string): ExtractionResult {
  const trimmed = text.trim()
  const namePairs = extractNameProductPairs(trimmed)
  const multiCustomer = namePairs.length >= 2

  const product = detectProductFromText(trimmed)
  const sumInsured = extractSumInsured(trimmed)
  const documents = extractDocumentMentions(trimmed)

  if (multiCustomer) {
    const customers: ExtractedCustomer[] = namePairs.map((pair, i) => {
      const possessiveMobile = trimmed.match(new RegExp(`${pair.name.split(' ')[0]}['’]s\\s+(?:number|mobile)\\s+is\\s+(\\d{10})`, 'i'))
      const possessiveAge = trimmed.match(new RegExp(`${pair.name.split(' ')[0]}\\s+age\\s+(\\d{1,2})`, 'i'))
      return {
        matchKey: `customer-${i + 1}`,
        name: pair.name,
        product: pair.product,
        age: possessiveAge ? Number(possessiveAge[1]) : undefined,
        mobile: possessiveMobile ? possessiveMobile[1] : undefined,
        city: extractCity(trimmed),
        confidence: 0.72,
      }
    })
    // No single shared `product` here — each customer already carries its own product
    // (that's the entire point of the multi-customer/multi-product case, PROMPT.md section 9.1).
    return { intent: 'CREATE_OR_UPDATE_ORDER', sumInsured: sumInsured ? { value: sumInsured, confidence: 0.85 } : undefined, customers, documents, rawText: text }
  }

  const mobile = extractMobile(trimmed)
  const pincode = mobile ? extractPincode(trimmed.replace(mobile, '')) : extractPincode(trimmed)
  const dob = extractDob(trimmed)
  const excludeForAge = new Set([mobile, pincode, dob].filter(Boolean) as string[])
  const age = extractAge(trimmed, excludeForAge)
  const email = extractEmail(trimmed)
  const city = extractCity(trimmed)
  const occupation = extractOccupation(trimmed)
  const family = extractFamilyMembers(trimmed)
  // Every word of the detected city (e.g. "Mulund West" -> "Mulund", "West") and every
  // dependent's name (e.g. "Sunita", "Aarav" from "Wife Sunita 38 and son Aarav 12") must be
  // excluded individually — matching them as whole multi-word strings misses the case where
  // extractName() finds them one word at a time, which used to fabricate phantom customers.
  const knownWords = [
    ...allKnownCityWords(trimmed),
    product === 'SUPERSTAR' ? 'Superstar' : product === 'ASSURE' ? 'Assure' : '',
    ...family.flatMap((f) => f.name.split(' ')),
  ].filter(Boolean)
  const name = extractName(trimmed, knownWords)

  const incomeMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*lakh\s*(?:income|annual|p\.?a\.?)/i)

  if (
    !name && !mobile && !email && !product && !dob && !city && !pincode && !occupation &&
    age === undefined && family.length === 0 && documents.length === 0
  ) {
    return { intent: 'UNKNOWN', customers: [], documents, rawText: text }
  }

  const customer: ExtractedCustomer = {
    matchKey: 'customer-1',
    name,
    dob,
    age,
    mobile,
    email,
    city,
    pincode: mobile ? undefined : pincode,
    occupation,
    annualIncome: incomeMatch ? Math.round(Number(incomeMatch[1]) * 100000) : undefined,
    numAdults: family.length > 0 ? 1 : undefined,
    numChildren: family.filter((f) => f.relationship === 'Son' || f.relationship === 'Daughter').length || undefined,
    memberAges: family.length ? family.map((f) => f.age) : undefined,
    confidence: name || mobile ? 0.9 : 0.6,
  }

  if (family.length && !customer.nomineeName) {
    const spouse = family.find((f) => f.relationship === 'Spouse')
    if (spouse) {
      customer.nomineeName = spouse.name
      customer.nomineeRelationship = 'Spouse'
    }
  }

  return {
    intent: 'CREATE_OR_UPDATE_ORDER',
    product: product ? { value: product, confidence: 0.95 } : undefined,
    sumInsured: sumInsured ? { value: sumInsured, confidence: 0.9 } : undefined,
    customers: [customer],
    documents,
    rawText: text,
  }
}

/** Mocked transcription for simulated voice notes — see PROMPT.md section 9.9. */
export function transcribeAudio(scriptedTranscript: string): string {
  return scriptedTranscript
}

/** Mocked document OCR/classification — see PROMPT.md section 9.6. */
export function classifyDocumentFileName(fileName: string): ExtractedDocumentRef['category'] {
  const lower = fileName.toLowerCase()
  if (lower.includes('aadhaar') || lower.includes('passport') || lower.includes('id')) return 'ADD_PROOF'
  if (lower.includes('pan')) return 'FORM_60'
  if (lower.includes('cheque') || lower.includes('bank') || lower.includes('passbook')) return 'BANK_DETAILS'
  if (lower.includes('salary') || lower.includes('income') || lower.includes('itr')) return 'INCOME_PROOF'
  if (lower.includes('medical') || lower.includes('report')) return 'MEDICAL'
  return 'UNKNOWN'
}
