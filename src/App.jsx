import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useTheme } from './context/ThemeContext.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Login from './views/Login.jsx'
import Leaderboard from './views/Leaderboard.jsx'
import Scorecard from './views/Scorecard.jsx'
import Competitors from './views/Competitors.jsx'
import Alerts from './views/Alerts.jsx'
import SourcingLog from './views/SourcingLog.jsx'
import ProductsScheduling from './views/ProductsScheduling.jsx'
import PostsComments from './views/PostsComments.jsx'
import ResearchCouncil from './views/ResearchCouncil.jsx'
import Brands from './views/Brands.jsx'
import Discovery from './views/Discovery.jsx'
import FormulaStudio from './views/FormulaStudio.jsx'
import Settings from './views/Settings.jsx'
import Help from './views/Help.jsx'

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
  help: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M6 6a2 2 0 013.5 1.5c0 1-1.5 1-1.5 2M8 12v.5"/></svg>,
  compass: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5"/><path d="M10.5 5.5L9 9 5.5 10.5 7 7z"/></svg>,
}

// minRole: 'viewer' = everyone, 'analyst' = analyst+owner, 'owner' = owner only
const navItems = [
  { to: '/leaderboard', label: 'Leaderboard', icon: Icons.chart, minRole: 'viewer' },
  { to: '/discovery', label: 'Discovery', icon: Icons.compass, minRole: 'viewer' },
  { to: '/posts', label: 'Posts & Comments', icon: Icons.chat, minRole: 'viewer' },
  { to: '/council', label: 'Research Council', icon: Icons.users, minRole: 'viewer' },
  { to: '/formula', label: 'Formula Studio', icon: Icons.formula, minRole: 'owner' },
  { to: '/brands', label: 'Brands', icon: Icons.flag, minRole: 'analyst' },
  { to: '/competitors', label: 'Competitors', icon: Icons.clipboard, minRole: 'analyst' },
  { to: '/alerts', label: 'Alerts', icon: Icons.bell, minRole: 'viewer' },
  { to: '/sourcing', label: 'Sourcing Log', icon: Icons.clipboard, minRole: 'analyst' },
  { to: '/agents', label: 'Products & Agents', icon: Icons.gear, minRole: 'analyst' },
]

const bottomNav = [
  { to: '/settings', label: 'Settings', icon: Icons.gear, minRole: 'owner' },
  { to: '/help', label: 'Help', icon: Icons.help, minRole: 'viewer' },
]

const ROLE_LEVEL = { viewer: 0, analyst: 1, owner: 2 }
function hasAccess(userRole, minRole) {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[minRole] || 0)
}

const mobileNav = [
  { to: '/leaderboard', label: 'Board', icon: Icons.chart },
  { to: '/council', label: 'Council', icon: Icons.users },
  { to: '/posts', label: 'Posts', icon: Icons.chat },
  { to: '/alerts', label: 'Alerts', icon: Icons.bell },
  { to: '/agents', label: 'Agents', icon: Icons.gear },
]

function Sidebar() {
  const { dark, toggle } = useTheme()
  const { user, logout } = useAuth()
  const role = user?.role || 'viewer'
  const ROLE_BADGE = { owner: 'text-indigo-400', analyst: 'text-emerald-400', viewer: 'text-gray-500' }

  return (
    <aside className="hidden md:flex w-[220px] shrink-0 bg-[#0f0f0f] flex-col h-screen sticky top-0 border-r border-[#1a1a1a]">
      {/* Workspace header */}
      <div className="px-5 py-5 border-b border-[#1a1a1a]">
        <p className="text-[13px] font-bold text-gray-200 tracking-tight leading-tight">Product Intelligence</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[11px] text-gray-500">{user?.name || 'Guest'}</p>
          <span className={`text-[9px] font-bold uppercase ${ROLE_BADGE[role] || ROLE_BADGE.viewer}`}>{role}</span>
          {role === 'viewer' && <span className="text-[9px] text-gray-600 border border-gray-700 px-1">VIEW ONLY</span>}
        </div>
      </div>

      {/* Main nav — filtered by role */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.filter(item => hasAccess(role, item.minRole)).map(({ to, label, icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={icon} />
        ))}
      </nav>

      {/* Bottom nav: Settings + Help + Theme + Logout */}
      <div className="border-t border-[#1a1a1a] py-2">
        {bottomNav.filter(item => hasAccess(role, item.minRole)).map(({ to, label, icon }) => (
          <SidebarLink key={to} to={to} label={label} icon={icon} />
        ))}
        <button
          onClick={toggle}
          className="flex items-center gap-3 px-5 py-2 text-[13px] text-gray-500 hover:text-gray-300 hover:bg-[#141414] transition-colors w-full border-l-[3px] border-transparent"
        >
          <span className="w-4 h-4 shrink-0 opacity-70">{dark ? Icons.sun : Icons.moon}</span>
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-5 py-2 text-[13px] text-red-500/70 hover:text-red-400 hover:bg-[#141414] transition-colors w-full border-l-[3px] border-transparent"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 shrink-0 opacity-70"><path d="M6 2H3v12h3M11 4l4 4-4 4M15 8H6"/></svg>
          Sign Out
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

function RequireAuth({ children, minRole = 'viewer' }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (!hasAccess(user.role, minRole)) return <Navigate to="/leaderboard" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={
        !user ? <Navigate to="/login" replace /> : (
          <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
            <Sidebar />
            <main className="flex-1 overflow-auto pb-16 md:pb-0">
              <Routes>
                <Route path="/" element={<Navigate to="/leaderboard" replace />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/product/:id" element={<Scorecard />} />
                <Route path="/discovery" element={<Discovery />} />
                <Route path="/posts" element={<PostsComments />} />
                <Route path="/council" element={<ResearchCouncil />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/help" element={<Help />} />
                <Route path="/brands" element={<RequireAuth minRole="analyst"><Brands /></RequireAuth>} />
                <Route path="/competitors" element={<RequireAuth minRole="analyst"><Competitors /></RequireAuth>} />
                <Route path="/sourcing" element={<RequireAuth minRole="analyst"><SourcingLog /></RequireAuth>} />
                <Route path="/agents" element={<RequireAuth minRole="analyst"><ProductsScheduling /></RequireAuth>} />
                <Route path="/formula" element={<RequireAuth minRole="owner"><FormulaStudio /></RequireAuth>} />
                <Route path="/settings" element={<RequireAuth minRole="owner"><Settings /></RequireAuth>} />
                <Route path="*" element={<Navigate to="/leaderboard" replace />} />
              </Routes>
            </main>
            <MobileTabBar />
          </div>
        )
      } />
    </Routes>
  )
}
