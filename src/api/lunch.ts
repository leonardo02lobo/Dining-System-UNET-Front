import { apiClient } from './client'
import type { ApiError } from '../types/auth'
import type {
  LunchCreatePayload,
  LunchIngredientPayload,
  LunchIngredientResponse,
  LunchInsufficientStockDetail,
  LunchMissingStockItem,
  LunchResponse,
  LunchStatus,
  LunchStockValidationResponse,
  LunchTemplateCreatePayload,
  LunchTemplateResponse,
  LunchTemplateUpdatePayload,
  LunchUpdatePayload,
} from '../types/lunch'

const LUNCH_PATH = '/lunches'
const TEMPLATE_PATH = '/lunch-templates'

export type ConfirmLunchResult =
  | { status: 'confirmed'; lunch: LunchResponse }
  | { status: 'insufficient_stock'; items: LunchMissingStockItem[] }

/**
 * ¿Es este error el 409 estructurado de stock insuficiente?
 *
 * Se reconoce por el `code` del cuerpo, no por el 409 a secas: la confirmación
 * también responde 409 cuando el servicio ya estaba confirmado o cuando el
 * borrador no tiene ingredientes, y esos no van al modal de faltantes.
 */
function insufficientStockDetail(err: unknown): LunchInsufficientStockDetail | null {
  const apiErr = err as Partial<ApiError> | undefined
  if (apiErr?.status !== 409) return null
  const detail = apiErr.detail as Partial<LunchInsufficientStockDetail> | undefined
  if (detail?.code !== 'insufficient_stock' || !Array.isArray(detail.items)) return null
  return detail as LunchInsufficientStockDetail
}

export const lunchApi = {
  listLunches: (params?: { date?: string; status?: LunchStatus }) => {
    const query = new URLSearchParams()
    if (params?.date) query.set('date', params.date)
    if (params?.status) query.set('status', params.status)
    const qs = query.toString()
    return apiClient.get<LunchResponse[]>(`${LUNCH_PATH}${qs ? `?${qs}` : ''}`)
  },
  /**
   * Crea el borrador **con sus ingredientes** en una sola petición (BE-01).
   * No mira el inventario: un borrador puede planificar lo que aún no hay.
   */
  createLunch: (data: LunchCreatePayload) =>
    apiClient.post<LunchResponse>(LUNCH_PATH, data),
  getLunch: (lunchId: number) =>
    apiClient.get<LunchResponse>(`${LUNCH_PATH}/${lunchId}`),
  updateLunch: (lunchId: number, data: LunchUpdatePayload) =>
    apiClient.patch<LunchResponse>(`${LUNCH_PATH}/${lunchId}`, data),
  deleteLunch: (lunchId: number) =>
    apiClient.delete<void>(`${LUNCH_PATH}/${lunchId}`),
  addLunchIngredient: (lunchId: number, data: LunchIngredientPayload) =>
    apiClient.post<LunchIngredientResponse>(`${LUNCH_PATH}/${lunchId}/ingredients`, data),
  /**
   * Reemplaza la receta completa de un borrador en una sola petición. Editar es
   * «esto es ahora la receta», no una secuencia de altas y bajas que puede
   * quedarse a medias si una de ellas falla.
   */
  setLunchIngredients: (lunchId: number, ingredients: LunchIngredientPayload[]) =>
    apiClient.put<LunchResponse>(`${LUNCH_PATH}/${lunchId}/ingredients`, ingredients),
  updateLunchIngredient: (
    lunchId: number,
    ingredientId: number,
    data: { baseQuantity?: number; unit?: string },
  ) =>
    apiClient.patch<LunchIngredientResponse>(
      `${LUNCH_PATH}/${lunchId}/ingredients/${ingredientId}`,
      data,
    ),
  deleteLunchIngredient: (lunchId: number, ingredientId: number) =>
    apiClient.delete<void>(`${LUNCH_PATH}/${lunchId}/ingredients/${ingredientId}`),
  /**
   * Vista previa del stock: sirve para avisar antes de confirmar, **no** para
   * decidir. Entre esta llamada y la confirmación el inventario puede cambiar,
   * y quien manda es lo que el backend lea bajo bloqueo.
   */
  validateStock: (lunchId: number) =>
    apiClient.get<LunchStockValidationResponse>(`${LUNCH_PATH}/${lunchId}/stock-validation`),
  recalculateLunch: (lunchId: number, data?: { platesQuantity?: number; basePlatesQuantity?: number }) =>
    apiClient.post<LunchResponse>(`${LUNCH_PATH}/${lunchId}/recalculate`, data ?? {}),
  listLunchTemplates: () =>
    apiClient.get<LunchTemplateResponse[]>(TEMPLATE_PATH),
  getLunchTemplate: (templateId: number) =>
    apiClient.get<LunchTemplateResponse>(`${TEMPLATE_PATH}/${templateId}`),
  createLunchTemplate: (data: LunchTemplateCreatePayload) =>
    apiClient.post<LunchTemplateResponse>(TEMPLATE_PATH, data),
  updateLunchTemplate: (templateId: number, data: LunchTemplateUpdatePayload) =>
    apiClient.patch<LunchTemplateResponse>(`${TEMPLATE_PATH}/${templateId}`, data),
  deleteLunchTemplate: (templateId: number) =>
    apiClient.delete<void>(`${TEMPLATE_PATH}/${templateId}`),

  /**
   * Confirma un borrador: descuenta el inventario, o no descuenta nada.
   *
   * Devuelve `insufficient_stock` con el detalle por insumo en vez de lanzar,
   * porque faltar stock no es un fallo de la petición sino una respuesta que la
   * pantalla tiene que mostrar. El resto de los 409 (ya confirmado, borrador sin
   * ingredientes) sí se propagan como error.
   */
  async confirmLunch(lunchId: number): Promise<ConfirmLunchResult> {
    try {
      const lunch = await apiClient.post<LunchResponse>(`${LUNCH_PATH}/${lunchId}/confirm`, {})
      return { status: 'confirmed', lunch }
    } catch (err) {
      const detail = insufficientStockDetail(err)
      if (detail) return { status: 'insufficient_stock', items: detail.items }
      throw err
    }
  },
}
