import type { DocumentCategory, FieldName, ProductCode } from '@/types'

export interface ProductConfig {
  code: ProductCode
  name: string
  planLabel: string
  tagline: string
  requiredFields: FieldName[]
  optionalFields: FieldName[]
  requiredDocuments: DocumentCategory[]
  sumInsuredOptions: number[]
  tenureOptions: { years: number; label: string }[]
  basePremiumPerLakhPerYear: number
  builtInCovers: string[]
}

// Product configuration layer (PROMPT.md section 5): keeps product-specific
// rules out of the flow/UI code so a third product can be added by adding a
// config entry, not by touching the wizard.
export const PRODUCTS: Record<ProductCode, ProductConfig> = {
  SUPERSTAR: {
    code: 'SUPERSTAR',
    name: 'Star Health Superstar',
    planLabel: 'Value Plus',
    tagline: 'Comprehensive family floater cover with built-in booster benefits.',
    requiredFields: [
      'fullName',
      'dob',
      'mobile',
      'email',
      'addressLine1',
      'pincode',
      'occupation',
      'annualIncome',
      'accountHolderName',
      'accountNumber',
      'ifsc',
      'bankName',
      'nomineeName',
      'nomineeRelationship',
    ],
    optionalFields: ['addressLine2', 'panAvailable'],
    requiredDocuments: ['ADD_PROOF', 'BANK_DETAILS', 'INCOME_PROOF'],
    sumInsuredOptions: [500000, 1000000, 1500000, 2000000, 2500000, 5000000, 7500000],
    tenureOptions: [
      { years: 1, label: '1 Year' },
      { years: 2, label: '2 Years' },
      { years: 3, label: '3 Years' },
    ],
    basePremiumPerLakhPerYear: 1550,
    builtInCovers: ['Health Booster', 'Premium Return', 'Limitless Loyalty Bonus', 'E-Connect'],
  },
  ASSURE: {
    code: 'ASSURE',
    name: 'Star Health Assure',
    planLabel: 'Classic',
    tagline: 'Simplified, budget-friendly individual health cover.',
    requiredFields: [
      'fullName',
      'dob',
      'mobile',
      'email',
      'addressLine1',
      'pincode',
      'occupation',
      'annualIncome',
      'accountHolderName',
      'accountNumber',
      'ifsc',
      'bankName',
      'nomineeName',
      'nomineeRelationship',
    ],
    optionalFields: ['addressLine2', 'panAvailable'],
    requiredDocuments: ['ADD_PROOF', 'BANK_DETAILS'],
    sumInsuredOptions: [300000, 500000, 1000000, 1500000, 2000000],
    tenureOptions: [
      { years: 1, label: '1 Year' },
      { years: 2, label: '2 Years' },
    ],
    basePremiumPerLakhPerYear: 1180,
    builtInCovers: ['Automatic Restore', 'No Claim Bonus'],
  },
}

export function detectProductFromText(text: string): ProductCode | null {
  const t = text.toLowerCase()
  if (/\bsuper\s*-?\s*star\b|\bsuperstar\b/.test(t)) return 'SUPERSTAR'
  if (/\bassure\b/.test(t)) return 'ASSURE'
  return null
}

export function estimatePremium(product: ProductCode, sumInsured: number, tenureYears: number): number {
  const cfg = PRODUCTS[product]
  const lakhs = sumInsured / 100000
  const annual = Math.round(lakhs * cfg.basePremiumPerLakhPerYear)
  const multiplier = tenureYears === 1 ? 1 : tenureYears === 2 ? 1.95 : 2.85
  return Math.round(annual * multiplier)
}
