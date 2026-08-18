let counter = 0

function pad(n: number, width: number) {
  return String(n).padStart(width, '0')
}

/** Demo-labeled, human-scannable IDs (PROMPT.md section 17) — never used to imply a real backend. */
export function nextDemoId(prefix: 'ORD' | 'QUO' | 'PROP' | 'PAY' | 'POL' | 'DOC' | 'MSG' | 'CONV' | 'ORDC' | 'AMB' | 'FLAG' | 'EVT') {
  counter += 1
  const seq = 1000 + counter
  return `${prefix}-DEMO-${pad(seq, 4)}`
}

export function policyNumber() {
  const now = new Date()
  const rand = Math.floor(100000 + Math.random() * 899999)
  return `P/${rand}/01/${now.getFullYear()}/${Math.floor(100000 + Math.random() * 899999)}`
}

export function nowIso() {
  return new Date().toISOString()
}
