import type { BadgeVariant } from '../components/ui/Badge'
import type { AuditEntry } from '../types/audit'

/**
 * Rótulos del historial de procesos.
 *
 * El servidor guarda **códigos** estables (`ELIMINAR`, `lunch_session`) y el texto legible
 * vive aquí: es interfaz, y la interfaz no se persiste. Las opciones de los desplegables no
 * se sacan de estos mapas sino del catálogo del servidor —lo que hay en el historial— para
 * no ofrecer filtros sin resultados ni quedarse corto cuando el backend registre un recurso
 * nuevo. Por eso cada rótulo desconocido cae al código en crudo: un historial que oculta lo
 * que no sabe nombrar deja de ser un historial.
 */

/** Prefijo que el servidor pone a lo que declara el cliente, no lo que él observó. */
const CLIENT_PREFIX = 'CLIENTE_'

const ACTION_LABEL: Record<string, string> = {
  CREAR: 'Creación',
  ACTUALIZAR: 'Modificación',
  ELIMINAR: 'Eliminación',
  CONSULTAR: 'Consulta',
  EXPORTAR: 'Exportación',
  LOGIN: 'Inicio de sesión',
  LOGOUT: 'Cierre de sesión',
  LOGIN_FALLIDO: 'Intento fallido',
  REVOCAR: 'Revocación',
  LEVANTAR: 'Levantamiento',
  FORCE_CLOSE_SESSION: 'Cierre forzado',
  GENERATE: 'Generación de reporte',
  GENERATE_SUMMARY_BY_CATEGORY: 'Reporte por categoría',
  GENERATE_SUMMARY_BY_ITEM: 'Reporte por insumo',
  DOWNLOAD_CSV: 'Descarga CSV',
  DOWNLOAD_PDF: 'Descarga PDF',
}

const RESOURCE_LABEL: Record<string, string> = {
  auth: 'Sesión',
  user: 'Usuario',
  users: 'Usuarios',
  user_permissions: 'Permisos de usuario',
  consumption: 'Consumo',
  consumptions: 'Consumos',
  sanction: 'Suspensión',
  sanctions: 'Suspensiones',
  lunch_session: 'Sesión de servicio',
  'lunch-sessions': 'Sesiones de servicio',
  lunch: 'Servicio de alimentación',
  lunches: 'Servicios de alimentación',
  acceso_directo: 'Acceso directo',
  accesos_directos: 'Accesos directos',
  external_person: 'Persona externa',
  'external-people': 'Personas externas',
  external_person_label: 'Etiqueta de externos',
  student: 'Estudiante',
  students: 'Padrón de estudiantes',
  inventory_item: 'Insumo',
  inventory: 'Inventario',
  'consumption-reports': 'Reportes de consumo',
  'audit-logs': 'Auditoría',
  statistics: 'Estadísticas',
  sedes: 'Sedes',
  careers: 'Carreras',
  'email-templates': 'Plantillas de correo',
  'email-settings': 'Configuración de correo',
}

/** Familias de acción, para que el color diga algo antes de leer el texto. */
const ACTION_VARIANT: Record<string, BadgeVariant> = {
  CREAR: 'success',
  ACTUALIZAR: 'info',
  ELIMINAR: 'danger',
  LOGIN_FALLIDO: 'danger',
  REVOCAR: 'warning',
  LEVANTAR: 'success',
  FORCE_CLOSE_SESSION: 'warning',
  EXPORTAR: 'warning',
  DOWNLOAD_CSV: 'warning',
  DOWNLOAD_PDF: 'warning',
  CONSULTAR: 'neutral',
  LOGIN: 'neutral',
  LOGOUT: 'neutral',
}

function stripClientPrefix(action: string): { code: string; fromClient: boolean } {
  return action.startsWith(CLIENT_PREFIX)
    ? { code: action.slice(CLIENT_PREFIX.length), fromClient: true }
    : { code: action, fromClient: false }
}

export function actionLabel(action: string): string {
  const { code, fromClient } = stripClientPrefix(action)
  const label = ACTION_LABEL[code] ?? code
  // Se marca en el propio rótulo: una entrada que escribió el navegador no puede leerse
  // igual que una que el servidor observó.
  return fromClient ? `${label} (cliente)` : label
}

export function actionVariant(action: string): BadgeVariant {
  const { code } = stripClientPrefix(action)
  return ACTION_VARIANT[code] ?? 'neutral'
}

export function resourceLabel(resource: string): string {
  return RESOURCE_LABEL[resource] ?? resource
}

/** `Usuario #7`, o solo el recurso cuando la operación no apunta a uno concreto. */
export function resourceWithId(entry: AuditEntry): string {
  const label = resourceLabel(entry.resource)
  return entry.resource_id ? `${label} #${entry.resource_id}` : label
}

/**
 * Resumen de una línea.
 *
 * Degrada a propósito: mientras el backend va enriqueciendo recurso por recurso, muchas
 * entradas solo traen método y ruta. Antes de dejar la celda vacía se compone el texto con
 * la acción y el recurso, que es lo que siempre está.
 */
export function entrySummary(entry: AuditEntry): string {
  if (entry.details) return entry.details
  const changed = Object.keys(entry.changes ?? {})
  if (changed.length > 0) {
    return `Cambió ${changed.map(fieldLabel).join(', ')}`
  }
  return `${actionLabel(entry.action)} de ${resourceWithId(entry)}`
}

const FIELD_LABEL: Record<string, string> = {
  name: 'nombre',
  email: 'correo',
  cedula: 'cédula',
  career: 'carrera',
  is_active: 'estado',
  role_id: 'rol',
  sede_id: 'sede',
  password: 'contraseña',
  acceso_directo_id: 'persona',
  consumption_date: 'fecha',
  status: 'estado',
}

export function fieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field
}

/** Marca que el servidor deja donde había un valor sensible. */
export const REDACTION_MARK = '«redactado»'

export function isRedacted(value: unknown): boolean {
  return value === REDACTION_MARK
}

/** Valor de un antes/después, listo para pintar. */
export function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function formatAuditDate(iso: string): string {
  return new Date(iso).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'medium' })
}

/**
 * Navegador a partir del `user_agent`.
 *
 * Vive aquí, y no en `LoginAuditPage`, porque las dos pantallas de auditoría muestran lo
 * mismo: duplicarlo garantizaba que un día dijeran cosas distintas del mismo dato.
 */
export function parseBrowser(ua: string | null): string {
  if (!ua) return '—'
  if (/Edg\//.test(ua))              return 'Edge'
  if (/Firefox\//.test(ua))          return 'Firefox'
  if (/Chrome\//.test(ua))           return 'Chrome'
  if (/Safari\//.test(ua))           return 'Safari'
  if (/curl|python-requests|axios/.test(ua)) return 'API Client'
  return ua.slice(0, 30) + '…'
}
