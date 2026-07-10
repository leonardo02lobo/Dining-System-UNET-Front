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
} from '../types/lunch'

const LUNCH_PATH = '/lunches'
const TEMPLATE_PATH = '/lunch-templates'

export interface CreateConfirmedLunchParams {
  name: string
  date: string
  platesQuantity: number
  basePlatesQuantity: number
  ingredients: LunchIngredientPayload[]
  saveAsTemplate: boolean
}

export type CreateConfirmedLunchResult =
  | { status: 'confirmed'; lunch: LunchResponse }
  | { status: 'insufficient_stock'; items: LunchStockValidationItem[] }

export const lunchApi = {
  listLunches: () =>
    apiClient.get<LunchResponse[]>(LUNCH_PATH),
  createLunch: (data: LunchCreatePayload) =>
    apiClient.post<LunchResponse>(LUNCH_PATH, data),
  getLunch: (lunchId: number) =>
    apiClient.get<LunchResponse>(`${LUNCH_PATH}/${lunchId}`),
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
  createLunchTemplate: (data: LunchTemplateCreatePayload) =>
    apiClient.post<LunchTemplateResponse>(TEMPLATE_PATH, data),

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

    await lunchApi.confirmLunch(createdLunch.id, recalculatedLunch)

    if (params.saveAsTemplate) {
      await lunchApi.createLunchTemplate({
        ...payload,
        lunchId: createdLunch.id,
        ingredients: params.ingredients,
      })
    }

    return { status: 'confirmed', lunch: createdLunch }
  },
}
