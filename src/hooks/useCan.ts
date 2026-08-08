import { useAuth } from '../context/AuthContext'
import { canAccess } from '../config/routeAccess'

/**
 * ¿Puede el usuario operar en esta pantalla?
 *
 * Desde que el backend gobierna las operaciones con el permiso de ruta, la interfaz
 * tiene que preguntar lo mismo que pregunta la guarda del servidor. Antes decidía
 * por rol, y eso es lo que dejaba a un usuario con la pantalla concedida mirando un
 * botón deshabilitado.
 *
 * Se apoya en `canAccess`, que ya resuelve con la precedencia correcta —permiso
 * explícito por usuario y, si no lo hay, la lista estática por rol—, la misma que
 * aplica `get_user_permissions` en el servidor. Reimplementarla aquí sería
 * garantizar que los dos lados se separen con el tiempo.
 */
export function useCan() {
  const { user, permissions } = useAuth()

  /** `false` sin usuario cargado: no se ofrecen acciones mientras se resuelve la sesión. */
  const can = (route: string): boolean =>
    user != null && canAccess(route, user.role.name, permissions)

  /** Para los endpoints que sirven a varias pantallas: basta con tener alguna. */
  const canAny = (...routes: string[]): boolean => routes.some(can)

  return { can, canAny }
}
