import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { authApi } from '../api/auth'
import type { User } from '../types/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  refetch: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refetch: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(() => {
    setLoading(true)
    authApi
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return (
    <AuthContext.Provider value={{ user, loading, refetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
