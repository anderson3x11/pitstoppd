import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext(null)

// `user` et `profile` désignent le même objet (profil de l'utilisateur connecté) :
// les pages utilisent `user` pour savoir si on est connecté, `profile` pour l'afficher.
export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = useCallback(async () => {
    setProfile(await api('/me').catch(() => null))
  }, [])

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false))
  }, [refreshProfile])

  const signOut = async () => {
    await api('/auth/logout', { method: 'POST' })
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user: profile, profile, loading, signOut, refreshProfile, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
