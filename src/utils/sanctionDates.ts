/**
 * Límites de la fecha de fin de una suspensión, replicados del backend
 * (`MAX_SANCTION_DAYS` en `app/core/config.py`).
 *
 * Se replican, no se consultan: el `<input type="date">` necesita `min`/`max` en el
 * momento de pintarse. Pero el atributo `max` solo acota el calendario — teclear la
 * fecha a mano lo esquiva —, así que la validación previa al envío de abajo es
 * obligatoria, y la del servidor sigue siendo la autoridad final.
 */
export const MAX_SANCTION_DAYS = 365

/** Fecha local de hoy en YYYY-MM-DD (sin el desfase de zona horaria de toISOString). */
export function todayISO(): string {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

/** Última fecha de fin admitida: hoy + MAX_SANCTION_DAYS. */
export function maxSanctionEndDate(from: string = todayISO()): string {
  const base = new Date(`${from}T00:00:00`)
  base.setDate(base.getDate() + MAX_SANCTION_DAYS)
  const year = base.getFullYear()
  const month = String(base.getMonth() + 1).padStart(2, '0')
  const day = String(base.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Valida la fecha de fin antes de llamar a la API. Devuelve el mensaje de error a
 * mostrar junto al campo, o `null` si es aceptable.
 *
 * Con `indefinite` marcada no hay nada que validar: la suspensión indefinida es una
 * elección explícita del operador, no el efecto secundario de dejar el campo vacío.
 */
export function validateSanctionEndDate(
  value: string,
  options: { indefinite: boolean; start?: string },
): string | null {
  if (options.indefinite) return null

  const start = options.start ?? todayISO()
  if (!value) {
    return 'Indica la fecha de fin o marca "Indefinida".'
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'La fecha de fin no es válida.'
  }
  if (value < start) {
    return 'La fecha de fin no puede ser anterior a hoy.'
  }
  const max = maxSanctionEndDate(start)
  if (value > max) {
    return `La suspensión no puede pasar de ${MAX_SANCTION_DAYS} días (máximo ${max}).`
  }
  return null
}
