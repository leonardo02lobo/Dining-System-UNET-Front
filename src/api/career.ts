import { apiClient } from './client'
import type { Career, CareerCreatePayload, CareerUpdatePayload } from '../types/career'

const BASE_PATH = '/careers'

export const careerApi = {
  list: () => apiClient.get<Career[]>(`${BASE_PATH}/`),
  create: (data: CareerCreatePayload) => apiClient.post<Career>(`${BASE_PATH}/`, data),
  update: (id: number, data: CareerUpdatePayload) =>
    apiClient.patch<Career>(`${BASE_PATH}/${id}`, data),
  remove: (id: number) => apiClient.delete<void>(`${BASE_PATH}/${id}`),
}
