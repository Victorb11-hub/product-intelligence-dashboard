import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { Navigate } from 'react-router-dom'

export default function Login() {
  const { user, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/leaderboard" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-white tracking-tight">Product Intelligence</h1>
          <p className="text-xs text-gray-500 mt-1">Evolution Equities LLC</p>
        </div>

        {/* Login card */}
        <div className="bg-[#111] border border-[#1a1a1a] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                className="w-full text-sm px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full text-sm px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-900/20 border border-red-800/30 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full py-2 bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-gray-600 mt-6">
          Wholesale Product Intelligence System
        </p>
      </div>
    </div>
  )
}
