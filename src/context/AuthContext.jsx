import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load session on mount and listen for auth changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        _loadRole(session.user.email)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        _loadRole(session.user.email)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function _loadRole(email) {
    try {
      const { data } = await supabase
        .from('dashboard_users')
        .select('name, role')
        .eq('email', email)
        .eq('active', true)
        .limit(1)

      if (data && data.length > 0) {
        setUser({ email, name: data[0].name, role: data[0].role })
      } else {
        // Auth user exists but no dashboard_users row — default to viewer
        setUser({ email, name: email.split('@')[0], role: 'viewer' })
      }
    } catch {
      setUser({ email, name: email.split('@')[0], role: 'viewer' })
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      await _logSecurity('login_failed', email, error.message)
      return { success: false, error: error.message }
    }
    await _logSecurity('login_success', email, '')
    return { success: true }
  }

  const logout = async () => {
    const email = user?.email
    await supabase.auth.signOut()
    setUser(null)
    if (email) await _logSecurity('logout', email, '')
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

async function _logSecurity(eventType, email, details) {
  try {
    await supabase.from('security_log').insert({
      event_type: eventType,
      user_email: email,
      details,
    })
  } catch {}
}
