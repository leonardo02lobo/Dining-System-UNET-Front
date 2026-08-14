import { describe, it, expect } from 'vitest'
import { ROUTE_ACCESS, canAccess, canOpen, DEFAULT_ROUTE, ROUTE_ALIASES } from './routeAccess'
import type { Permission } from '../api/permissions'

/**
 * Abrir una pantalla y operar en ella son dos preguntas distintas desde que consultar y
 * registrar consumos son la misma pantalla.
 *
 * El riesgo concreto que se fija aquí: `/comedor/registrar` es la ruta por defecto del
 * taquillero. Si la guarda usara `canAccess`, un usuario de solo consulta sería expulsado
 * a su ruta por defecto —esta misma— y quedaría rebotando.
 */

const SOLO_CONSULTA: Permission[] = [
  { route: '/comedor/consultar', label: 'Comedor: solo consulta', enabled: true },
  { route: '/comedor/registrar', label: 'Registro al Comedor',    enabled: false },
]

describe('canOpen frente a canAccess', () => {
  it('el permiso de consulta abre la pantalla de comedor', () => {
    expect(canOpen('/comedor/registrar', 'TAQUILLERO', SOLO_CONSULTA)).toBe(true)
  })

  it('pero no concede la capacidad de registrar', () => {
    expect(canAccess('/comedor/registrar', 'TAQUILLERO', SOLO_CONSULTA)).toBe(false)
  })

  it('la ruta por defecto del taquillero es siempre abrible', () => {
    // Sin esto, el rebote a `DEFAULT_ROUTE` sería un bucle.
    expect(canOpen(DEFAULT_ROUTE.TAQUILLERO, 'TAQUILLERO', SOLO_CONSULTA)).toBe(true)
  })

  it('sin ninguno de los dos permisos, la pantalla no se abre', () => {
    const ninguno: Permission[] = [
      { route: '/comedor/consultar', label: 'Comedor: solo consulta', enabled: false },
      { route: '/comedor/registrar', label: 'Registro al Comedor',    enabled: false },
    ]
    expect(canOpen('/comedor/registrar', 'TAQUILLERO', ninguno)).toBe(false)
  })

  it('una ruta sin alias se comporta igual que antes', () => {
    expect(canOpen('/inventario', 'TAQUILLERO', [])).toBe(false)
    expect(canOpen('/inventario', 'ADMIN', [])).toBe(true)
  })

  it('el alias no viaja en sentido contrario', () => {
    // `/comedor/registrar` no aparece como alias de nada: quien solo tiene registrar no
    // hereda por esta vía ninguna otra pantalla.
    expect(Object.values(ROUTE_ALIASES).flat()).not.toContain('/comedor/registrar')
  })
})

describe('las dos auditorías se conceden por separado', () => {
  it('el historial de procesos está catalogado para administración', () => {
    expect(ROUTE_ACCESS['/auditoria/procesos']).toEqual(['SUPER_ADMIN', 'ADMIN'])
  })

  it('tener la auditoría de accesos no abre el historial de procesos', () => {
    const soloAccesos: Permission[] = [
      { route: '/auditoria',          label: 'Auditoría de Acceso',   enabled: true },
      { route: '/auditoria/procesos', label: 'Historial de Procesos', enabled: false },
    ]
    expect(canOpen('/auditoria', 'ADMIN', soloAccesos)).toBe(true)
    expect(canOpen('/auditoria/procesos', 'ADMIN', soloAccesos)).toBe(false)
  })

  it('`/mi-actividad` queda fuera del catálogo y abierta a cualquier sesión', () => {
    // Catalogarla la haría revocable desde Gestión de Permisos sin que el servidor
    // respetara la revocación: `GET /audit-logs/me` solo exige sesión activa.
    expect(ROUTE_ACCESS['/mi-actividad']).toBeUndefined()
    expect(canOpen('/mi-actividad', 'TAQUILLERO', [])).toBe(true)
    expect(canOpen('/mi-actividad', 'ACCESO_DIRECTO', [])).toBe(true)
  })
})
