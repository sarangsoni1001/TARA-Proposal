import { NavLink } from 'react-router-dom'
import {
  Home, Rocket, Users, Building2, BarChart3, Landmark, Wrench, GraduationCap, HelpCircle, Info, ShieldCheck,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', icon: Home, to: '/' },
  { label: 'New Business', icon: Rocket, to: '/quote/new' },
  { label: 'Existing Customer', icon: Users, to: '/leads' },
  { label: 'GMC Business', icon: Building2, to: '#' },
  { label: 'Business Reports', icon: BarChart3, to: '#' },
  { label: 'My Centre', icon: Landmark, to: '#' },
  { label: 'Tools', icon: Wrench, to: '#' },
  { label: 'Grow Your Business', icon: GraduationCap, to: '#' },
  { label: 'Help & Support', icon: HelpCircle, to: '#' },
  { label: 'More Information', icon: Info, to: '#' },
]

export function Sidebar() {
  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-gray-200 bg-white px-3 py-4">
      <nav className="space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <button className="flex items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-sm font-semibold text-white hover:bg-brand-800">
        <ShieldCheck className="h-4 w-4" /> Sell
      </button>
    </aside>
  )
}
