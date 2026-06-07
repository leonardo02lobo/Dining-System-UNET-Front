/**
 * Normaliza un código de carnet/cédula leído por scanner o escrito manualmente.
 *
 * Casos manejados:
 *   "V0031419581.24249"  →  "31419581"   (V + ceros iniciales + sufijo después del punto)
 *   "V31419581.24249"    →  "31419581"   (V + sufijo después del punto)
 *   "31419581.24249"     →  "31419581"   (sin prefijo, solo sufijo)
 *   "31419581"           →  "31419581"   (ya limpio)
 */
export function normalizeCedula(raw: string): string {
  return raw
    .trim()
    .replace(/^[Vv][Ee]?[-]?/i, '') // elimina prefijo V, VE, V-, VE-
    .split('.')[0]                    // elimina sufijo después del punto
    .replace(/^0+/, '')               // elimina ceros iniciales
    .trim()
}
