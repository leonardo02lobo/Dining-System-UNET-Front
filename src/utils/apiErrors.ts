import type { ApiError } from '../types/auth'

export const CONFLICT = {
  consumptionToday: 'Esta persona ya registró un consumo hoy (puede haber sido en otra sede).',
  sanctionActive: 'Esta persona ya tiene una suspensión activa.',
  manualDuplicate: 'Esta persona ya tiene un consumo registrado en esa fecha (manual o de sesión, en cualquier sede).',
  sessionAlreadyOpen: 'Ya existe una sesión abierta para esa sede.',
}

export function errorMessage(
  err: unknown,
  overrides?: Record<number, string>,
  fallback = 'Error inesperado',
): string {
  const apiErr = err as Partial<ApiError> | undefined
  const status = apiErr?.status
  if (status != null && overrides?.[status]) return overrides[status]
  return apiErr?.message ?? fallback
}
