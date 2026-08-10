/**
 * Etiqueta con la que se clasifica a la gente externa.
 *
 * Sustituye al par fijo jubilado/externo: quien administra el comedor da acceso a
 * grupos —un congreso, una jornada— y necesita marcar de dónde salió cada persona
 * para poder retirarles el acceso a todos juntos cuando el evento termina.
 */
export interface ExternalPersonLabel {
  id: number
  name: string
  created_at?: string | null
}

export interface ExternalPersonLabelCreate {
  name: string
}

/**
 * Resultado de la baja en lote. `deactivated` y `unchanged` van por separado porque
 * "he dado de baja a 38" y "2 ya lo estaban" son dos noticias distintas para quien
 * acaba de pulsar el botón.
 */
export interface LabelDeactivateResult {
  label_id: number
  label: string
  total: number
  deactivated: number
  unchanged: number
}
