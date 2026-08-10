import { apiClient } from './client'
import type {
  ExternalPersonLabel,
  ExternalPersonLabelCreate,
  LabelDeactivateResult,
} from '../types/externalPersonLabel'

const PATH = '/external-people/labels'

export interface PaginatedLabels {
  total: number
  items: ExternalPersonLabel[]
}

export const externalPersonLabelApi = {
  list: () => apiClient.get<PaginatedLabels>(PATH),
  create: (data: ExternalPersonLabelCreate) =>
    apiClient.post<ExternalPersonLabel>(PATH, data),
  rename: (id: number, name: string) =>
    apiClient.patch<ExternalPersonLabel>(`${PATH}/${id}`, { name }),
  remove: (id: number) => apiClient.delete<void>(`${PATH}/${id}`),
  /**
   * Da de baja a **todas** las personas de la etiqueta. El servidor lo reserva a
   * SUPER_ADMIN: dar de baja a cuarenta de una vez no puede exigir menos que dar de
   * baja a una sola.
   */
  deactivateAll: (id: number) =>
    apiClient.post<LabelDeactivateResult>(`${PATH}/${id}/deactivate`, {}),
}
