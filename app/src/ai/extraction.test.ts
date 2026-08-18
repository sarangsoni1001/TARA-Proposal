import { describe, expect, it } from 'vitest'
import { extractFromMessage, classifyDocumentFileName } from './extraction'

describe('extractFromMessage — single customer, single message', () => {
  it('extracts name, age, city, product and sum insured from one sentence', () => {
    const r = extractFromMessage('Need Superstar for Rajesh Kumar age 42 Mumbai 10 lakh cover.')
    expect(r.intent).toBe('CREATE_OR_UPDATE_ORDER')
    expect(r.product?.value).toBe('SUPERSTAR')
    expect(r.sumInsured?.value).toBe(1000000)
    expect(r.customers).toHaveLength(1)
    expect(r.customers[0].name).toBe('Rajesh Kumar')
    expect(r.customers[0].age).toBe(42)
    expect(r.customers[0].city).toBe('Mumbai')
  })

  it('returns UNKNOWN for text with no extractable signal', () => {
    const r = extractFromMessage('ok thanks!')
    expect(r.intent).toBe('UNKNOWN')
    expect(r.customers).toHaveLength(0)
  })
})

describe('extractFromMessage — random-order fragments (scenario 3)', () => {
  it.each([
    ['Mumbai', { city: 'Mumbai' }],
    ['Superstar', {}],
    ['9876543210', { mobile: '9876543210' }],
    ['Rajesh Kumar', { name: 'Rajesh Kumar' }],
    ['42', { age: 42 }],
  ])('extracts the right field from the fragment %j', (text, expected) => {
    const r = extractFromMessage(text)
    expect(r.customers[0] ?? {}).toMatchObject(expected)
  })

  it('recognizes the product from a one-word fragment', () => {
    const r = extractFromMessage('Superstar')
    expect(r.product?.value).toBe('SUPERSTAR')
  })
})

describe('extractFromMessage — address-only fragment (regression)', () => {
  it('extracts city and pincode without fabricating a customer named after the city', () => {
    const r = extractFromMessage('Address is Mulund West, Mumbai 400081.')
    expect(r.intent).toBe('CREATE_OR_UPDATE_ORDER')
    expect(r.customers[0].name).toBeUndefined()
    expect(r.customers[0].pincode).toBe('400081')
  })
})

describe('extractFromMessage — domain acronyms are not names (regression)', () => {
  it('does not treat "DOB" as the customer name in "His DOB is 15/03/1970."', () => {
    const r = extractFromMessage('His DOB is 15/03/1970.')
    expect(r.customers[0].dob).toBe('15/03/1970')
    expect(r.customers[0].name).toBeUndefined()
  })
})

describe('extractFromMessage — correction phrasing is not a name (regression)', () => {
  it('does not treat "Actually Rajesh" as a two-word name in "Actually Rajesh is 45."', () => {
    const r = extractFromMessage('Actually Rajesh is 45.')
    expect(r.customers[0].name).toBe('Rajesh')
    expect(r.customers[0].age).toBe(45)
  })
})

describe('extractFromMessage — multiple customers, multiple products (scenario 4/5, regression)', () => {
  it('splits into exactly two customers with their own correct product, not phantom entries', () => {
    const r = extractFromMessage(
      "Create Superstar for Rajesh age 42 Mumbai and Assure for Priya age 34 Pune. Rajesh's number is 9876543210. I'll send documents for both.",
    )
    expect(r.customers).toHaveLength(2)
    const rajesh = r.customers.find((c) => c.name === 'Rajesh')
    const priya = r.customers.find((c) => c.name === 'Priya')
    expect(rajesh).toBeDefined()
    expect(priya).toBeDefined()
    expect(rajesh?.product).toBe('SUPERSTAR')
    expect(priya?.product).toBe('ASSURE')
    expect(rajesh?.mobile).toBe('9876543210')
    // No bogus names like "Create", "Mumbai and", "Rajesh age", "Priya age" should appear.
    expect(r.customers.map((c) => c.name)).toEqual(['Rajesh', 'Priya'])
  })
})

describe('extractFromMessage — family members feed the nominee suggestion', () => {
  it('suggests the spouse as nominee from "Wife Sunita 38 and son Aarav 12."', () => {
    const r = extractFromMessage('Wife Sunita 38 and son Aarav 12.')
    expect(r.customers[0].nomineeName).toBe('Sunita')
    expect(r.customers[0].nomineeRelationship).toBe('Spouse')
    // The dependents' names must not be mistaken for the primary customer's own name.
    expect(r.customers[0].name).toBeUndefined()
  })
})

describe('classifyDocumentFileName', () => {
  it.each([
    ['Aadhaar_front.jpg', 'ADD_PROOF'],
    ['PAN_card.jpg', 'FORM_60'],
    ['HDFC_cancelled_cheque.jpg', 'BANK_DETAILS'],
    ['Salary_slip_June.pdf', 'INCOME_PROOF'],
    ['random_scan.jpg', 'UNKNOWN'],
  ])('classifies %s as %s', (fileName, category) => {
    expect(classifyDocumentFileName(fileName)).toBe(category)
  })
})
