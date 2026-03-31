import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { useTheme } from './context/ThemeContext.jsx'
import Leaderboard from './views/Leaderboard.jsx'
import Scorecard from './views/Scorecard.jsx'
import Competitors from './views/Competitors.jsx'
import Alerts from './views/Alerts.jsx'
import SourcingLog from './views/SourcingLog.jsx'
import ProductsScheduling from './views/ProductsScheduling.jsx'
import PostsComments from './views/PostsComments.jsx'

const navItems = [
  { to: '/leaderboard', label: 'Leaderboard', icon: '📊' },
  { to: '/posts', label: 'Posts & Comments', icon: '💬' },
  { to: '/competitors', label: 'Competitors', icon: '🏪' },
  { to: '/alerts', label: 'Alerts', icon: '🔔' },
  { to: '/sourcing', label: 'Sourcing', icon: '📦' },
  { to: '/agents', label: 'Products & Agents', icon: '🤖' },
]

function Sidebar() {
  const { dark, toggle } = useTheme()

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
          Product Intelligence
        </h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Health & Wellness Import</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="text-base">{dark ? '☀️' : '🌙'}</span>
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/leaderboard" replace />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/product/:id" element={<Scorecard />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/sourcing" element={<SourcingLog />} />
          <Route path="/agents" element={<ProductsScheduling />} />
          <Route path="/posts" element={<PostsComments />} />
        </Routes>
      </main>
    </div>
  )
}
