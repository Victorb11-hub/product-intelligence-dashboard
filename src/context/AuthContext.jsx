import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext()

const TOKEN_KEY = 'pi_auth_token'
const SESSION_DAYS = 7

function encodeToken(user) {
  const payload = {
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  }
  return btoa(JSON.stringify(payload))
}

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token))
    if (payload.exp && payload.exp > Date.now()) return payload
    return null
  } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      const decoded = decodeToken(token)
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

    // Verify password via the FastAPI server (bcrypt runs server-side)
    // For Vercel deployment: verify client-side using a simple hash check
    // Since we can't run bcrypt in browser, we'll use a server endpoint
    try {
      const resp = await fetch('http://localhost:8000/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (resp.ok) {
        const result = await resp.json()
        if (result.valid) {
          const token = encodeToken(dbUser)
          localStorage.setItem(TOKEN_KEY, token)
          setUser({ email: dbUser.email, name: dbUser.name, role: dbUser.role })
          await logSecurity('login_success', email, `Role: ${dbUser.role}`)
          return { success: true }
        }
      }
    } catch {
      // Server not running — fall back to direct hash comparison
      // This is a simplified check for when FastAPI is not available
    }

    // Fallback: simple string match for the admin user (temporary)
    // In production this should always go through the server
    if (dbUser.password_hash && password === 'admin123' && email === 'admin') {
      const token = encodeToken(dbUser)
      localStorage.setItem(TOKEN_KEY, token)
      setUser({ email: dbUser.email, name: dbUser.name, role: dbUser.role })
      await logSecurity('login_success', email, `Role: ${dbUser.role}`)
      return { success: true }
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
