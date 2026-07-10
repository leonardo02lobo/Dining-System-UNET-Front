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
