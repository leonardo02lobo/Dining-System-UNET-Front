import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { permissionsApi, type Permission } from '../api/permissions'
import type { User } from '../types/auth'

interface AuthContextValue {
  user: User | null
  loading: boolean
  permissions: Permission[]
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  permissions: [],
  refetch: () => Promise.resolve(),
  logout: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,        setUser]        = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading,     setLoading]     = useState(true)
  const navigate = useNavigate()

  const refetch = useCallback((): Promise<void> => {
    setLoading(true)
    return authApi
      .me()
      .then(async (u) => {
        setUser(u)
        try {
          const perms = await permissionsApi.getByUser(u.id, u.role.name)
          setPermissions(perms)
        } catch {
          setPermissions([])
        }
      })
      .catch(() => { setUser(null); setPermissions([]) })
      .finally(() => setLoading(false))
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // ignorar errores al cerrar sesión
    }
    setUser(null)
    setPermissions([])
    navigate('/login')
  }, [navigate])

  useEffect(() => {
    refetch()
  }, [refetch])

  return (
    <AuthContext.Provider value={{ user, loading, permissions, refetch, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
