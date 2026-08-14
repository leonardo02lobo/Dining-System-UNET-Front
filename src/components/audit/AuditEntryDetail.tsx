import { Badge } from '../ui/Badge'
import type { AuditEntry } from '../../types/audit'
import {
  fieldLabel,
  formatChangeValue,
  isRedacted,
  parseBrowser,
} from '../../utils/auditLabels'

interface AuditEntryDetailProps {
  entry: AuditEntry
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-800 break-words">{value}</dd>
    </div>
  )
}

/**
 * Detalle de una entrada: el antes/después, la prosa y el contexto técnico.
 *
 * Se pinta dentro de la tabla, no en un modal: auditar consiste en comparar entradas
 * seguidas, y un modal obliga a cerrar y reabrir para pasar a la siguiente.
 */
export function AuditEntryDetail({ entry }: AuditEntryDetailProps) {
  const changes = Object.entries(entry.changes ?? {})

  return (
    <div className="space-y-4">
      {/* El detalle en prosa no se repite aquí: la columna Resumen de la fila ya lo muestra
          entero, y verlo dos veces al abrir la fila hace pensar que son dos cosas
          distintas. Lo que el detalle añade es el antes/después y el contexto técnico. */}
      {changes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <caption className="sr-only">Campos modificados en esta operación</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Campo
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Antes
                </th>
                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Después
                </th>
              </tr>
            </thead>
            <tbody>
              {changes.map(([field, change]) => (
                <tr key={field} className="border-b border-slate-100 last:border-0">
                  <th scope="row" className="px-3 py-2 text-left font-medium text-slate-700">
                    {fieldLabel(field)}
                  </th>
                  {/* El valor redactado se muestra tal como llega. Que el campo cambió es
                      información; volver a taparlo escondería el cambio entero. */}
                  <td className="px-3 py-2 text-slate-500">
                    {isRedacted(change.antes) ? (
                      <Badge variant="neutral">Redactado</Badge>
                    ) : (
                      <span className="line-through decoration-slate-300">
                        {formatChangeValue(change.antes)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {isRedacted(change.después) ? (
                      <Badge variant="warning">Redactado</Badge>
                    ) : (
                      formatChangeValue(change.después)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="Operación" value={`${entry.method ?? '—'} ${entry.path ?? ''}`.trim()} />
        <Meta label="Respuesta" value={entry.status_code ? String(entry.status_code) : '—'} />
        <Meta label="IP" value={entry.ip_address ?? '—'} />
        <Meta label="Dispositivo" value={parseBrowser(entry.user_agent)} />
      </dl>

      {changes.length === 0 && (
        <p className="text-sm text-slate-600">
          Esta entrada no registró qué campos cambiaron, solo la operación en sí.
        </p>
      )}
    </div>
  )
}
