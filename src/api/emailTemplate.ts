import { apiClient } from './client'

export interface EmailTemplate {
  key: string
  subject: string
  body: string
  placeholders: string[]
  updated_at?: string | null
}

export interface EmailTemplateUpdate {
  subject: string
  body: string
}

export const emailTemplateApi = {
  getSanction: () => apiClient.get<EmailTemplate>('/email-templates/sanction'),
  updateSanction: (data: EmailTemplateUpdate) =>
    apiClient.put<EmailTemplate>('/email-templates/sanction', data),
}

/** Configuración del emisor y CC del correo (#5). */
export interface EmailSettings {
  from_name: string | null
  from_address: string | null
  cc: string | null
  updated_at?: string | null
}

export interface EmailSettingsUpdate {
  from_name: string
  from_address: string
  /** Lista de correos en copia separada por comas (opcional). */
  cc?: string | null
}

export const emailSettingsApi = {
  get: () => apiClient.get<EmailSettings>('/email-settings'),
  update: (data: EmailSettingsUpdate) => apiClient.put<EmailSettings>('/email-settings', data),
}
