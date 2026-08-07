import { apiClient } from './client'

/**
 * Claves de plantilla que el backend reconoce. Cualquier otra responde 404.
 * `sanction` notifica la suspensión; `sanction_lift`, su levantamiento.
 */
export type EmailTemplateKey = 'sanction' | 'sanction_lift'

export interface EmailTemplate {
  key: string
  subject: string
  body: string
  /**
   * Marcadores admitidos **por esta plantilla**, no una lista global: el correo de
   * levantamiento no reabre el motivo de la sanción, así que no ofrece `{motivo}` ni
   * `{descripcion}`. Por eso la lista llega del servidor y no se cablea en el panel.
   */
  placeholders: string[]
  updated_at?: string | null
}

export interface EmailTemplateUpdate {
  subject: string
  body: string
}

export const emailTemplateApi = {
  get: (key: EmailTemplateKey) => apiClient.get<EmailTemplate>(`/email-templates/${key}`),
  update: (key: EmailTemplateKey, data: EmailTemplateUpdate) =>
    apiClient.put<EmailTemplate>(`/email-templates/${key}`, data),
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
