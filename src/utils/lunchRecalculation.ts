import type { LunchFormIngredient, PreloadedLunch, RecalculationPreview } from '../types/lunch'

/**
 * Recálculo proporcional de ingredientes por regla de tres.
 *
 *     cantidad_nueva = cantidad_original × platos_nuevos / platos_base
 *
 * Invariantes:
 *
 * 1. `base_quantity` + `base_plates` son el origen inmutable de cada ingrediente.
 *    Todo valor mostrado se deriva SIEMPRE de ese par, nunca de un resultado ya
 *    recalculado, de modo que N cambios seguidos de platos no acumulan error.
 * 2. El cálculo se hace en coma flotante sin recortar decimales; el redondeo
 *    ocurre solo al presentar (`displayQuantity` / `formatQuantity`) o al enviar
 *    al backend (`payloadQuantity`).
 * 3. Platos base ≤ 0, cantidades negativas o valores no finitos no producen
 *    resultados: devuelven 0 (ver `isValidPlateCount` para validar en el form).
 *
 * La fuente de verdad es el backend (`POST /lunches/{id}/recalculate`, que
 * aplica la misma fórmula sobre `base_quantity`/`base_plates_quantity`); este
 * módulo es la previsualización inmediata del formulario.
 */

/** Cantidad base de platos por defecto del formulario. */
export const BASE_PLATES = 500

/** Decimales de presentación para unidades continuas (kg, L, g, mL). */
export const DISPLAY_DECIMALS = 2

/** Decimales conservados al persistir/enviar una cantidad continua. */
export const STORAGE_DECIMALS = 3

/**
 * Unidades que no admiten fracciones: no se puede pedir 11,67 unidades.
 * Regla de negocio: se redondea SIEMPRE hacia arriba, porque quedarse corto
 * de insumo deja platos sin servir.
 */
const DISCRETE_UNITS = new Set([
  'unidad', 'unidades', 'und', 'ud', 'u',
  'docena', 'docenas',
  'paquete', 'paquetes', 'paq',
  'pieza', 'piezas',
  'bolsa', 'bolsas',
  'caja', 'cajas',
  'lata', 'latas',
  'bandeja', 'bandejas',
])

/** ¿La unidad se maneja en piezas enteras (unidad, docena, paquete...)? */
export function isDiscreteUnit(unit: string): boolean {
  return DISCRETE_UNITS.has(unit.trim().toLowerCase())
}

/** Redondeo half-up estable frente al error binario (1.005 → 1.01, no 1.00). */
function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor * (1 + Number.EPSILON)) / factor
}

/** Una cantidad de platos válida es un entero finito mayor que cero. */
export function isValidPlateCount(plates: number): boolean {
  return Number.isFinite(plates) && plates > 0
}

/**
 * Regla de tres pura, sin redondear.
 * Devuelve 0 si la base de platos no es válida (requisito: base > 0) o si
 * alguna cantidad es negativa.
 */
export function scaleQuantity(
  baseQuantity: number,
  basePlates: number,
  targetPlates: number,
): number {
  if (!isValidPlateCount(basePlates)) return 0
  if (!Number.isFinite(targetPlates) || targetPlates < 0) return 0
  if (!Number.isFinite(baseQuantity) || baseQuantity < 0) return 0

  return (baseQuantity * targetPlates) / basePlates
}

/** Regla de tres aplicada a un ingrediente del formulario, sin redondear. */
export function scaleIngredient(item: LunchFormIngredient, targetPlates: number): number {
  return scaleQuantity(item.base_quantity, item.base_plates, targetPlates)
}

/** Cantidad por plato del ingrediente (derivada del par original). */
export function quantityPerPlate(item: LunchFormIngredient): number {
  return scaleQuantity(item.base_quantity, item.base_plates, 1)
}

/**
 * Redondeo de presentación según la unidad:
 * - continuas (kg, L, g, mL...): `DISPLAY_DECIMALS` decimales;
 * - discretas (unidad, docena...): entero hacia arriba.
 */
export function displayQuantity(value: number, unit: string): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return isDiscreteUnit(unit) ? Math.ceil(value) : roundTo(value, DISPLAY_DECIMALS)
}

/** Redondeo al persistir: conserva más decimales que la presentación. */
export function payloadQuantity(value: number, unit: string): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return isDiscreteUnit(unit) ? Math.ceil(value) : roundTo(value, STORAGE_DECIMALS)
}

/** Cantidad formateada para la UI: `11,67 kg` (locale es-VE). */
export function formatQuantity(value: number, unit: string): string {
  const rounded = displayQuantity(value, unit)
  const text = rounded.toLocaleString('es-VE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: isDiscreteUnit(unit) ? 0 : DISPLAY_DECIMALS,
  })
  return unit ? `${text} ${unit}` : text
}

/**
 * Formato para cantidades observadas (stock disponible), que nunca se redondean
 * hacia arriba: exagerar la existencia de una unidad discreta haría pasar por
 * suficiente un stock que no lo es.
 */
export function formatStock(value: number, unit: string): string {
  const rounded = Number.isFinite(value) ? roundTo(value, DISPLAY_DECIMALS) : 0
  const text = rounded.toLocaleString('es-VE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: DISPLAY_DECIMALS,
  })
  return unit ? `${text} ${unit}` : text
}

/** Construye un ingrediente del formulario desde una línea de plantilla. */
export function buildIngredientFromTemplate(
  item: PreloadedLunch['ingredients'][0],
  basePlates: number,
  available: number,
): LunchFormIngredient {
  const safeBasePlates = isValidPlateCount(basePlates) ? basePlates : 1
  const baseQuantity = Number.isFinite(item.base_quantity) && item.base_quantity > 0
    ? item.base_quantity
    : 0

  return {
    ingredient_id: item.ingredient_id,
    ingredient_name: item.ingredient_name,
    category: item.category,
    unit: item.unit,
    base_quantity: baseQuantity,
    base_plates: safeBasePlates,
    calculated_quantity: displayQuantity(baseQuantity, item.unit),
    available_quantity: available,
  }
}

/**
 * Recalcula `calculated_quantity` de cada ingrediente para `targetPlates`
 * partiendo siempre de la cantidad original. No muta la lista recibida.
 */
export function recalculateIngredients(
  items: LunchFormIngredient[],
  targetPlates: number,
): LunchFormIngredient[] {
  return items.map((item) => ({
    ...item,
    calculated_quantity: displayQuantity(scaleIngredient(item, targetPlates), item.unit),
  }))
}

/**
 * Comparativa original vs. recalculado para la tabla de recálculo.
 * `previousPlates` es la cantidad de platos vigente del formulario y
 * `newPlates` la deseada; ambas se derivan del par original del ingrediente.
 */
export function getRecalculationPreview(
  items: LunchFormIngredient[],
  previousPlates: number,
  newPlates: number,
): RecalculationPreview[] {
  return items.map((item) => ({
    ingredient_id: item.ingredient_id,
    ingredient_name: item.ingredient_name,
    unit: item.unit,
    base_plates: item.base_plates,
    base_quantity: displayQuantity(item.base_quantity, item.unit),
    previous_quantity: displayQuantity(scaleIngredient(item, previousPlates), item.unit),
    new_quantity: displayQuantity(scaleIngredient(item, newPlates), item.unit),
  }))
}
