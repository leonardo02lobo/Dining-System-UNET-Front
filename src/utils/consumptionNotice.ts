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
export function previousConsumptionMessage(consumption: DayConsumptionRef): string {
  const origin = consumption.is_manual
    ? 'registrado manualmente'
    : 'registrado en taquilla'
  const sede = consumption.sede_name ? ` en la sede ${consumption.sede_name}` : ''
  return `Ya registró su consumo a las ${formatConsumptionTime(consumption.registered_at)}${sede} (${origin}).`
}

/** Hora local HH:mm del consumo. Una marca ilegible es peor que no mostrarla. */
export function formatConsumptionTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}
