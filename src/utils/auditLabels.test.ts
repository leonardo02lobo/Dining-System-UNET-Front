import { describe, it, expect } from 'vitest'
import {
  actionLabel,
  actionVariant,
  entrySummary,
  parseBrowser,
  resourceLabel,
  resourceWithId,
} from './auditLabels'
import type { AuditEntry } from '../types/audit'

const BASE: AuditEntry = {
  id: 1,
  user_id: 7,
  actor_name: 'Ana Rodríguez',
  actor_email: 'ana@unet.edu.ve',
  actor_role: 'ADMIN',
  action: 'ELIMINAR',
  resource: 'user',
  resource_id: '9',
  details: null,
  changes: null,
  method: 'DELETE',
  path: '/users/{user_id}',
  status_code: 204,
  ip_address: null,
  user_agent: null,
  created_at: '2026-08-12T10:00:00Z',
}

describe('auditLabels', () => {
  it('traduce los códigos conocidos', () => {
    expect(actionLabel('ELIMINAR')).toBe('Eliminación')
    expect(resourceLabel('lunch_session')).toBe('Sesión de servicio')
  })

  it('muestra en crudo lo que no sabe nombrar', () => {
    // Un historial que oculta lo que no reconoce deja de ser un historial.
    expect(actionLabel('ACCION_NUEVA')).toBe('ACCION_NUEVA')
    expect(resourceLabel('recurso_nuevo')).toBe('recurso_nuevo')
  })

  it('distingue lo que declaró el cliente de lo que observó el servidor', () => {
    expect(actionLabel('CLIENTE_EXPORTAR')).toBe('Exportación (cliente)')
    expect(actionVariant('CLIENTE_EXPORTAR')).toBe(actionVariant('EXPORTAR'))
  })

  it('colorea por familia y cae en neutral ante lo desconocido', () => {
    expect(actionVariant('ELIMINAR')).toBe('danger')
    expect(actionVariant('CREAR')).toBe('success')
    expect(actionVariant('ACCION_NUEVA')).toBe('neutral')
  })

  it('nombra el recurso con su identificador solo cuando lo hay', () => {
    expect(resourceWithId(BASE)).toBe('Usuario #9')
    expect(resourceWithId({ ...BASE, resource_id: null })).toBe('Usuario')
  })

  describe('entrySummary', () => {
    it('usa el detalle en prosa cuando lo hay', () => {
      expect(entrySummary({ ...BASE, details: 'Baja de la cuenta' })).toBe('Baja de la cuenta')
    })

    it('sin prosa, nombra los campos que cambiaron', () => {
      const entry = { ...BASE, changes: { name: { antes: 'a', después: 'b' } } }
      expect(entrySummary(entry)).toBe('Cambió nombre')
    })

    it('sin nada, compone con la acción y el recurso en vez de dejarlo vacío', () => {
      expect(entrySummary(BASE)).toBe('Eliminación de Usuario #9')
    })
  })

  it('resume el navegador y tolera su ausencia', () => {
    expect(parseBrowser(null)).toBe('—')
    expect(parseBrowser('Mozilla/5.0 Chrome/120')).toBe('Chrome')
    expect(parseBrowser('python-requests/2.31')).toBe('API Client')
  })
})
