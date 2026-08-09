import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess, DEFAULT_ROUTE } from '../config/routeAccess'

export function ProtectedRoute() {
  const { user, loading, permissions } = useAuth()
  const location = useLocation()

  // El spinner a pantalla completa es solo para el arranque, cuando todavía no hay
  // nada que mostrar. Con una sesión ya cargada se sigue pintando la interfaz: una
  // revalidación en segundo plano no debe vaciar la pantalla que el usuario está
  // mirando, que es lo que producía el pantallazo en blanco al abrir un submenú.
  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!canAccess(location.pathname, user.role.name, permissions)) {
    return <Navigate to={DEFAULT_ROUTE[user.role.name]} replace />
  }

  return <Outlet />
}
