import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
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

  /**
   * `navigate` cambia de identidad en cada cambio de ruta: `useNavigate()` lo
   * memoiza con el pathname actual. Con `navigate` en las dependencias, `refetch`
   * se recreaba en cada navegación y el efecto de arranque volvía a ejecutarse,
   * de modo que abrir un submenú ponía `loading` en true otra vez y
   * `ProtectedRoute` desmontaba toda la interfaz —cabecera, menú y pantalla— para
   * dejar el spinner a pantalla completa mientras reconsultaba `/users/me` y los
   * permisos. Ese es el pantallazo en blanco que se reportó tras el despliegue,
   * y donde la red es lenta la pantalla se quedaba así varios segundos.
   *
   * La ref mantiene `refetch` y `logout` estables sin renunciar a navegar.
   */
  const navigateRef = useRef(navigate)
  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  const refetch = useCallback((): Promise<void> => {
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
      .catch(() => {
        setUser(null)
        setPermissions([])
        navigateRef.current('/login')
      })
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
    navigateRef.current('/login')
  }, [])

  // Una sola vez, al montar: la sesión no se revalida al navegar.
  useEffect(() => {
    void refetch()
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
