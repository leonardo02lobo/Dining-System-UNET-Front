import { FileQuestion } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { DEFAULT_ROUTE } from '../config/routeAccess'
import { useAuth } from '../context/AuthContext'

/**
 * Pantalla para una dirección que no existe.
 *
 * Vive **dentro** del layout (`Index`) y detrás de `ProtectedRoute`, y las dos cosas
 * son a propósito: dentro del layout la barra de navegación sigue en pantalla, así que
 * quien llega aquí por una errata tiene por dónde salir; detrás de `ProtectedRoute`, un
 * visitante sin sesión sigue yendo a `/login` como antes, sin que una URL mal escrita
 * revele qué pantallas existen.
 *
 * La salida apunta a `DEFAULT_ROUTE[rol]`, no a `/`: un taquillero no tiene nada que
 * hacer en la raíz —`ProtectedRoute` lo devolvería a `/comedor/registrar` de todos
 * modos— y un botón que rebota es peor que no tenerlo.
 */
export function NotFoundPage() {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const homeRoute = user ? DEFAULT_ROUTE[user.role.name] : '/'

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <FileQuestion className="h-7 w-7 text-slate-500" aria-hidden="true" />
        </div>

        <p className="text-sm font-semibold tracking-wide text-slate-400">ERROR 404</p>
        <h1 className="mt-1 text-xl font-bold text-slate-800">Esta página no existe</h1>

        <p className="mt-3 text-sm text-slate-500">
          No hay ninguna pantalla en{' '}
          {/* La dirección se muestra tal cual: casi siempre es una errata, y verla es lo
              que permite darse cuenta sin tener que adivinar qué se escribió mal. */}
          <code className="break-all rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-slate-700">
            {pathname}
          </code>
          . Puede que el enlace esté mal escrito o que la pantalla ya no exista.
        </p>

        <Link to={homeRoute} className="mt-6 inline-block">
          <Button variant="primary">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  )
}
