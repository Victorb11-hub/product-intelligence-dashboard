import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext()

const TOKEN_KEY = 'pi_auth_token'

function decodeToken(token) {
  // Decode JWT payload (middle part) — signature verified server-side
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null  // Not a valid JWT
    const payload = JSON.parse(atob(parts[1]))
    if (payload.exp && payload.exp * 1000 > Date.now()) return payload
    return null  // Expired
  } catch { return null }
}

function _legacyDecodeToken(token) {
  // Support old base64 tokens during transition — will be removed
  try {
    const payload = JSON.parse(atob(token))
    if (payload.exp && payload.exp > Date.now()) return payload
    return null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Periodic token expiry check
  useEffect(() => {
    const interval = setInterval(() => {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token && !decodeToken(token)) {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      const decoded = decodeToken(token) || _legacyDecodeToken(token)
      if (decoded) setUser(decoded)
      else localStorage.removeItem(TOKEN_KEY)
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase
      .from('dashboard_users')
      .select('id, name, email, role, password_hash, active')
      .eq('email', email)
      .eq('active', true)
      .limit(1)

    if (error || !data || data.length === 0) {
      await logSecurity('login_failed', email, 'User not found')
      return { success: false, error: 'Invalid credentials' }
    }

    const dbUser = data[0]

    // Verify password server-side only — no client-side fallback ever
    const apiBase = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8000'
    try {
      const resp = await fetch(`${apiBase}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!resp.ok) {
        await logSecurity('login_failed', email, `Server error: ${resp.status}`)
        return { success: false, error: 'Authentication server error. Try again.' }
      }
      const result = await resp.json()
      if (result.valid && result.token) {
        localStorage.setItem(TOKEN_KEY, result.token)
        setUser({ email: dbUser.email, name: result.name || dbUser.name, role: result.role || dbUser.role })
        await logSecurity('login_success', email, `Role: ${result.role}`)
        return { success: true }
      }
    } catch {
      await logSecurity('login_failed', email, 'Server unreachable')
      return { success: false, error: 'Agent server not reachable. Start the server with python start.py' }
    }

    await logSecurity('login_failed', email, 'Wrong password')
    return { success: false, error: 'Invalid credentials' }
  }

  const logout = () => {
    if (user) logSecurity('logout', user.email, '')
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  const isOwner = user?.role === 'owner'
  const isAnalyst = user?.role === 'analyst' || isOwner
  const isViewer = !!user

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isOwner, isAnalyst, isViewer }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

async function logSecurity(eventType, email, details) {
  try {
    await supabase.from('security_log').insert({
      event_type: eventType,
      user_email: email,
      details,
    })
  } catch {}
}
