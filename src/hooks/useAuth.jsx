import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, favorite_team, top_pilots')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) await loadProfile(session.user.id)
      else setProfile(null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
