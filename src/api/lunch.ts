import { apiClient } from './client'
import type {
  LunchCreatePayload,
  LunchIngredientPayload,
  LunchIngredientResponse,
  LunchResponse,
  LunchStockValidationItem,
  LunchStockValidationResponse,
  LunchTemplateCreatePayload,
  LunchTemplateResponse,
  LunchTemplateUpdatePayload,
  LunchUpdatePayload,
} from '../types/lunch'

const LUNCH_PATH = '/lunches'
const TEMPLATE_PATH = '/lunch-templates'

export interface CreateConfirmedLunchParams {
  name: string
  date: string
  platesQuantity: number
  basePlatesQuantity: number
  ingredients: LunchIngredientPayload[]
}

export type CreateConfirmedLunchResult =
  | { status: 'confirmed'; lunch: LunchResponse }
  | { status: 'insufficient_stock'; items: LunchStockValidationItem[] }

export const lunchApi = {
  listLunches: (params?: { date?: string }) => {
    const qs = params?.date ? `?date=${encodeURIComponent(params.date)}` : ''
    return apiClient.get<LunchResponse[]>(`${LUNCH_PATH}${qs}`)
  },
  createLunch: (data: LunchCreatePayload) =>
    apiClient.post<LunchResponse>(LUNCH_PATH, data),
  getLunch: (lunchId: number) =>
    apiClient.get<LunchResponse>(`${LUNCH_PATH}/${lunchId}`),
  updateLunch: (lunchId: number, data: LunchUpdatePayload) =>
    apiClient.patch<LunchResponse>(`${LUNCH_PATH}/${lunchId}`, data),
  addLunchIngredient: (lunchId: number, data: LunchIngredientPayload) =>
    apiClient.post<LunchIngredientResponse>(`${LUNCH_PATH}/${lunchId}/ingredients`, data),
  validateStock: (lunchId: number) =>
    apiClient.get<LunchStockValidationResponse>(`${LUNCH_PATH}/${lunchId}/stock-validation`),
  recalculateLunch: (lunchId: number, data: LunchResponse) =>
    apiClient.post<LunchResponse>(`${LUNCH_PATH}/${lunchId}/recalculate`, data),
  confirmLunch: (lunchId: number, data: LunchResponse) =>
    apiClient.post<LunchResponse>(`${LUNCH_PATH}/${lunchId}/confirm`, data),
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
   * Composed flow to create, recalculate, stock-check and confirm a lunch in a
   * single call (fixes.md #19). Returns `insufficient_stock` (without confirming)
   * when the pantry can't cover the recalculated quantities.
   */
  async createConfirmedLunch(
    params: CreateConfirmedLunchParams,
  ): Promise<CreateConfirmedLunchResult> {
    const payload: LunchCreatePayload = {
      name: params.name,
      date: params.date,
      platesQuantity: params.platesQuantity,
      basePlatesQuantity: params.basePlatesQuantity,
      ingredients: [],
    }

    const createdLunch = await lunchApi.createLunch(payload)

    await Promise.all(
      params.ingredients.map((ingredientPayload) =>
        lunchApi.addLunchIngredient(createdLunch.id, ingredientPayload),
      ),
    )

    const lunchToRecalculate = await lunchApi.getLunch(createdLunch.id)
    const recalculatedLunch = await lunchApi.recalculateLunch(createdLunch.id, {
      ...lunchToRecalculate,
      platesQuantity: params.platesQuantity,
      basePlatesQuantity: params.basePlatesQuantity,
    })

    const stockValidation = await lunchApi.validateStock(createdLunch.id)
    if (!stockValidation.isValid) {
      return { status: 'insufficient_stock', items: stockValidation.items }
    }

    // El backend genera/actualiza SIEMPRE la plantilla al confirmar el almuerzo
    // (upsert por nombre). El frontend ya no crea la plantilla manualmente (#11).
    await lunchApi.confirmLunch(createdLunch.id, recalculatedLunch)

    return { status: 'confirmed', lunch: createdLunch }
  },
}
