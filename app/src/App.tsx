import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from '@/components/shell/AppShell'
import { Home } from '@/pages/Home'
import { Leads } from '@/pages/Leads'
import { QuoteNew } from '@/pages/QuoteNew'
import { Proposal } from '@/pages/Proposal'
import { Checkout } from '@/pages/Checkout'
import { WhatsApp } from '@/pages/WhatsApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/quote/new" element={<QuoteNew />} />
          <Route path="/proposal/:candidateId" element={<Proposal />} />
          <Route path="/checkout/:candidateId" element={<Checkout />} />
        </Route>
        <Route path="/whatsapp" element={<WhatsApp />} />
      </Routes>
    </BrowserRouter>
  )
}
