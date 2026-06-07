import { apiClient } from './client'
import type {
  LunchCreatePayload,
  LunchIngredientPayload,
  LunchIngredientResponse,
  LunchResponse,
  LunchStockValidationResponse,
  LunchTemplateCreatePayload,
  LunchTemplateResponse,
} from '../types/lunch'

const LUNCH_PATH = '/lunches'
const TEMPLATE_PATH = '/lunch-templates'

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
}
