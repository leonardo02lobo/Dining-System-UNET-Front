import type { RoleName } from '../types/auth'
import type { Permission } from '../api/permissions'

export const ROUTE_ACCESS: Record<string, RoleName[]> = {
  // Ya no nombra una pantalla propia: `/comedor/consultar` redirige a la pantalla
  // unificada de comedor. Sigue siendo un permiso real —ocho endpoints del backend lo
  // aceptan en su `require_any_permission`— y lo que concede es el **modo consulta**
  // de esa pantalla. Borrarlo dejaría sin acceso a quien solo lo tenga concedido.
  '/comedor/consultar':        ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/comedor/registrar':        ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/comedor/reporte':          ['SUPER_ADMIN', 'ADMIN'],
  '/comedor/historial':        ['SUPER_ADMIN', 'ADMIN'],
  '/comedor/registro-manual':  ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/comedor/suspender':        ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/comedor/sesion':           ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/suspendidos':              ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/accesos_directos':         ['SUPER_ADMIN', 'ADMIN'],
  '/accesos_directos/importar': ['SUPER_ADMIN', 'ADMIN'],
  // Gemela de ("/estudiantes", "Padrón de Estudiantes") en `_PERMISSIONS` del backend:
  // sin la entrada de allí la ruta queda sin control de permisos server-side.
  '/estudiantes':              ['SUPER_ADMIN', 'ADMIN'],
  '/gente-externa':            ['SUPER_ADMIN', 'ADMIN'],
  '/usuarios':                 ['SUPER_ADMIN', 'ADMIN'],
  '/inventario':               ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/general':       ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/reportes-consumo': ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/crear':         ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/plantillas':    ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/pruebas-almuerzo': ['SUPER_ADMIN', 'ADMIN'],
  '/auditoria':                ['SUPER_ADMIN', 'ADMIN'],
  // Gemela de ("/auditoria/procesos", "Historial de Procesos") en `_PERMISSIONS`. Es una
  // ruta distinta de `/auditoria` y no un alias: aquella dice **quién entró** y esta **qué
  // hizo**, así que conceder una no concede la otra.
  '/auditoria/procesos':       ['SUPER_ADMIN', 'ADMIN'],
  //
  // `/mi-actividad` NO figura aquí, y es deliberado. `canAccess` devuelve `true` para lo
  // que no está catalogado, así que la pantalla queda abierta a cualquier sesión — que es
  // exactamente lo que el servidor sostiene: `GET /audit-logs/me` solo exige sesión activa
  // y siempre devuelve lo del que pregunta. Catalogarla la haría revocable desde Gestión
  // de Permisos sin que el servidor respetara esa revocación: pantalla negada por el
  // cliente sobre datos que la API sigue entregando. Y quitarle a alguien el ver lo que él
  // mismo hizo no es una decisión que este sistema deba ofrecer. No añadirla en la próxima
  // revisión de paridad con el backend.
  '/admin/permisos':           ['SUPER_ADMIN'],
  '/admin/plantilla-correo':   ['SUPER_ADMIN'],
  '/verificar-acceso-directo': ['ACCESO_DIRECTO', 'SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/sedes':                    ['SUPER_ADMIN', 'ADMIN'],
  '/admin/carreras':           ['SUPER_ADMIN', 'ADMIN'],
}

export const DEFAULT_ROUTE: Record<RoleName, string> = {
  SUPER_ADMIN:  '/',
  ADMIN:        '/',
  TAQUILLERO:   '/comedor/registrar',
  ACCESO_DIRECTO: '/verificar-acceso-directo',
}

/**
 * Rutas que abren la misma pantalla que otra.
 *
 * El permiso alternativo concede **ver**, nunca operar: quién puede registrar lo sigue
 * decidiendo `canAccess('/comedor/registrar')`, que es exactamente lo que exige
 * `POST /consumptions/` en el servidor. Meter estos alias dentro de `canAccess`
 * convertiría el permiso de solo consulta en permiso de registro dentro del cliente, y
 * el 403 del servidor sería la primera noticia de la diferencia.
 */
export const ROUTE_ALIASES: Record<string, string[]> = {
  '/comedor/registrar': ['/comedor/consultar'],
}

/**
 * ¿Puede el usuario **abrir** esta pantalla?
 *
 * Para la guarda de navegación y el menú. Distinto de `canAccess`, que responde por la
 * **capacidad** de operar y por eso se queda estricta.
 */
export function canOpen(
  path: string,
  roleName: RoleName,
  permissions: Permission[],
): boolean {
  if (canAccess(path, roleName, permissions)) return true
  return (ROUTE_ALIASES[path] ?? []).some((alt) => canAccess(alt, roleName, permissions))
}

export function canAccess(
  path: string,
  roleName: RoleName,
  permissions: Permission[],
): boolean {
  const roles = ROUTE_ACCESS[path]
  if (!roles) return true

  if (permissions.length > 0) {
    const perm = permissions.find((p) => p.route === path)
    if (perm !== undefined) return perm.enabled
  }

  return roles.includes(roleName)
}
