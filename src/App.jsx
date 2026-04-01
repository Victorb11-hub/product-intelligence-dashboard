import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useTheme } from './context/ThemeContext.jsx'
import Leaderboard from './views/Leaderboard.jsx'
import Scorecard from './views/Scorecard.jsx'
import Competitors from './views/Competitors.jsx'
import Alerts from './views/Alerts.jsx'
import SourcingLog from './views/SourcingLog.jsx'
import ProductsScheduling from './views/ProductsScheduling.jsx'
import PostsComments from './views/PostsComments.jsx'
import ResearchCouncil from './views/ResearchCouncil.jsx'
import Brands from './views/Brands.jsx'
import FormulaStudio from './views/FormulaStudio.jsx'
import Settings from './views/Settings.jsx'

// SVG icon components — clean, 16px
const Icons = {
  chart: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 14V6M6 14V2M10 14V8M14 14V4"/></svg>,
  chat: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2h12v9H5L2 14V2z"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="5.5" cy="5" r="2.5"/><circle cx="11" cy="5.5" r="2"/><path d="M1 14c0-3 2-4.5 4.5-4.5s4.5 1.5 4.5 4.5M9.5 14c0-2.5 1.5-3.5 3-3.5S15 11.5 15 14"/></svg>,
  flag: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 2v12M2 2h10l-2 4 2 4H2"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 6a4 4 0 018 0c0 4 2 5 2 5H2s2-1 2-5M6.5 13.5a1.5 1.5 0 003 0"/></svg>,
  clipboard: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="2" width="10" height="12"/><path d="M6 1h4v2H6zM6 7h4M6 10h3"/></svg>,
  gear: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="2.5"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="14" height="10"/><path d="M1 3l7 5 7-5"/></svg>,
  sun: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13.5 8.5A5.5 5.5 0 017.5 2.5 5.5 5.5 0 1013.5 8.5z"/></svg>,
  formula: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h10M3 8h7M3 13h10M11 6l2 4M11 10l2-4"/></svg>,
}

const navItems = [
  { to: '/leaderboard', label: 'Leaderboard', icon: Icons.chart },
  { to: '/posts', label: 'Posts & Comments', icon: Icons.chat },
  { to: '/council', label: 'Research Council', icon: Icons.users },
  { to: '/formula', label: 'Formula Studio', icon: Icons.formula },
  { to: '/brands', label: 'Brands', icon: Icons.flag },
  { to: '/competitors', label: 'Competitors', icon: Icons.clipboard },
  { to: '/alerts', label: 'Alerts', icon: Icons.bell },
  { to: '/sourcing', label: 'Sourcing Log', icon: Icons.chart },
  { to: '/agents', label: 'Products & Agents', icon: Icons.gear },
]

const bottomNav = [
  { to: '/settings', label: 'Settings', icon: Icons.gear },
]

const mobileNav = [
  { to: '/leaderboard', label: 'Board', icon: Icons.chart },
  { to: '/council', label: 'Council', icon: Icons.users },
  { to: '/posts', label: 'Posts', icon: Icons.chat },
  { to: '/alerts', label: 'Alerts', icon: Icons.bell },
  { to: '/agents', label: 'Agents', icon: Icons.gear },
]

function Sidebar() {
  const { dark, toggle } = useTheme()

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 bg-[#0f0f0f] flex-col h-screen sticky top-0 border-r border-[#1a1a1a]">
      {/* Workspace header */}
      <div className="px-5 py-5 border-b border-[#1a1a1a]">
        <p className="text-[13px] font-bold text-gray-200 tracking-tight leading-tight">Product Intelligence</p>
        <p className="text-[11px] text-gray-500 mt-0.5">Victor · Health & Wellness</p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ to, label, icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={icon} />
        ))}
      </nav>

      {/* Bottom nav: Settings + Dark mode */}
      <div className="border-t border-[#1a1a1a] py-2">
        {bottomNav.map(({ to, label, icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={icon} />
        ))}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-5 py-2 text-[13px] text-gray-500 hover:text-gray-300 hover:bg-[#141414] transition-colors w-full border-l-[3px] border-transparent"
        >
          <span className="w-4 h-4 shrink-0 opacity-70">{dark ? Icons.sun : Icons.moon}</span>
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  )
}

function MobileTabBar() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-[#1a1a1a] flex justify-around items-center h-14 safe-area-bottom">
      {mobileNav.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 flex-1 py-1 text-[10px] font-medium transition-colors ${
              isActive ? 'text-indigo-400' : 'text-gray-500'
            }`
          }
        >
          <span className="w-4 h-4">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function SidebarLink({ to, label, icon }) {
  return (
    <NavLink to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-5 py-2 text-[13px] transition-colors border-l-[3px] ${
          isActive
            ? 'border-indigo-500 bg-[#1a1a1a] text-gray-100 font-medium'
            : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-[#141414]'
        }`
      }>
      <span className="w-4 h-4 shrink-0 opacity-70">{icon}</span>
      {label}
    </NavLink>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
      <Sidebar />
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Navigate to="/leaderboard" replace />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/product/:id" element={<Scorecard />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/sourcing" element={<SourcingLog />} />
          <Route path="/agents" element={<ProductsScheduling />} />
          <Route path="/posts" element={<PostsComments />} />
          <Route path="/council" element={<ResearchCouncil />} />
          <Route path="/formula" element={<FormulaStudio />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <MobileTabBar />
    </div>
  )
}
