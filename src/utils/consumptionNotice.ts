import type { DayConsumptionRef } from '../types/consumption'

/**
 * Texto del aviso de consumo previo, compartido por Registro al Comedor y Registro
 * Manual. Vive aquí y no en cada pantalla porque el aviso debe decir exactamente lo
 * mismo en las dos: un genérico "ya comió" no le permite al taquillero explicarle a
 * la persona qué ocurrió, y dos redacciones distintas convierten el mismo hecho en
 * dos mensajes que el operador tiene que interpretar.
 *
 * Incluye la hora, la sede y el origen (taquilla o registro manual), que es
 * justamente lo que `is_manual` viaja a transportar.
 */
export function previousConsumptionMessage(
  consumption: DayConsumptionRef,
  options?: { currentSedeName?: string | null },
): string {
  const origin = consumption.is_manual
    ? 'registrado manualmente'
    : 'registrado en taquilla'
  const hora = formatConsumptionTime(consumption.registered_at)

  // Comió en otra sede: el dónde pasa al principio de la frase.
  //
  // El taquillero de un municipio no tiene forma de saber que esta persona ya comió
  // en otro, y con la sede enterrada al final —entre la hora y el origen— la frase se
  // lee igual que la de un duplicado dentro de la propia sede. Es justo el caso en el
  // que hay que explicarle algo a la persona que tiene delante.
  if (isOtherSedeConsumption(consumption, options?.currentSedeName)) {
    return `Ya consumió hoy en otra sede: ${consumption.sede_name}, a las ${hora} (${origin}).`
  }

  const sede = consumption.sede_name ? ` en la sede ${consumption.sede_name}` : ''
  return `Ya registró su consumo a las ${hora}${sede} (${origin}).`
}

/**
 * ¿El consumo ocurrió en una sede distinta de aquella en la que se está consultando?
 *
 * Devuelve `false` cuando falta cualquiera de los dos nombres: sin saber una de las dos
 * sedes no se puede afirmar que sean distintas, y afirmarlo de más pondría un aviso de
 * "otra sede" sobre un consumo de la propia.
 */
export function isOtherSedeConsumption(
  consumption: DayConsumptionRef,
  currentSedeName?: string | null,
): boolean {
  if (!consumption.sede_name || !currentSedeName) return false
  return consumption.sede_name !== currentSedeName
}

/** Hora local HH:mm del consumo. Una marca ilegible es peor que no mostrarla. */
export function formatConsumptionTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}
