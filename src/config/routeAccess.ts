import type { RoleName } from '../types/auth'
import type { Permission } from '../api/permissions'

export const ROUTE_ACCESS: Record<string, RoleName[]> = {
  '/comedor/consultar':        ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/comedor/registrar':        ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/comedor/reporte':          ['SUPER_ADMIN', 'ADMIN'],
  '/comedor/historial':        ['SUPER_ADMIN', 'ADMIN'],
  '/comedor/registro-manual':  ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/comedor/sesion':           ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/suspendidos':              ['SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/accesos_directos':         ['SUPER_ADMIN', 'ADMIN'],
  '/gente-externa':            ['SUPER_ADMIN', 'ADMIN'],
  '/usuarios':                 ['SUPER_ADMIN', 'ADMIN'],
  '/inventario':               ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/general':       ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/reportes-consumo': ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/crear':         ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/plantillas':    ['SUPER_ADMIN', 'ADMIN'],
  '/inventario/pruebas-almuerzo': ['SUPER_ADMIN', 'ADMIN'],
  '/auditoria':                ['SUPER_ADMIN', 'ADMIN'],
  '/admin/acceso-estudiantes': ['SUPER_ADMIN', 'ADMIN'],
  '/admin/permisos':           ['SUPER_ADMIN'],
  '/admin/plantilla-correo':   ['SUPER_ADMIN'],
  '/verificar-acceso-directo': ['ACCESO_DIRECTO', 'SUPER_ADMIN', 'ADMIN', 'TAQUILLERO'],
  '/sedes':                    ['SUPER_ADMIN', 'ADMIN'],
}

export const DEFAULT_ROUTE: Record<RoleName, string> = {
  SUPER_ADMIN:  '/',
  ADMIN:        '/',
  TAQUILLERO:   '/comedor/registrar',
  ACCESO_DIRECTO: '/verificar-acceso-directo',
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
