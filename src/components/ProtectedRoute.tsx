import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccess, DEFAULT_ROUTE } from '../config/routeAccess'

export function ProtectedRoute() {
  const { user, loading, permissions } = useAuth()
  const location = useLocation()

  if (loading) {
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
