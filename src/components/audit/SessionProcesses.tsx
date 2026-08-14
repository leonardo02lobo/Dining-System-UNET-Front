import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { processHistoryApi } from '../../api/audit'
import type { AuditEntry, LoginAuditEntry } from '../../types/audit'
import { parseBrowser } from '../../utils/auditLabels'
import { Spinner } from '../ui/Spinner'
import { ProcessHistoryTable } from './ProcessHistoryTable'

/** Tope de procesos que se traen al desplegar. Una jornada de taquilla no llega a tanto. */
const SESSION_PROCESS_LIMIT = 200

interface SessionProcessesProps {
  session: LoginAuditEntry
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
 * Qué hizo esta persona **en esta sesión**.
 *
 * Se pide al desplegar y no al cargar el listado: cincuenta sesiones por página serían
 * cincuenta consultas para ver, casi siempre, una sola.
 *
 * El enlace es por el `sid` del token, no por ventana de tiempo. Con la misma persona
 * conectada en dos equipos, la ventana atribuiría a una sesión lo que hizo la otra — y
 * distinguirlas es justamente para lo que están la IP y el dispositivo de cada fila.
 */
export function SessionProcesses({ session }: SessionProcessesProps) {
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const data = await processHistoryApi.list(0, SESSION_PROCESS_LIMIT, {
          login_audit_id: session.id,
        })
        setRows(data.items)
        setTotal(data.total)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar los procesos de la sesión')
      } finally {
        setLoading(false)
      }
    })()
  }, [session.id])

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Meta label="IP" value={session.ip_address ?? '—'} />
        <Meta label="Dispositivo" value={parseBrowser(session.user_agent)} />
        <Meta
          label="Agente completo"
          value={session.user_agent ?? '—'}
        />
        <Meta label="Procesos" value={String(total)} />
      </dl>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
          <Spinner size="sm" />
          Cargando los procesos de esta sesión…
        </div>
      ) : rows.length === 0 && !error ? (
        <div className="space-y-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm text-slate-600">
          <p>
            No hay procesos atados a esta sesión. Puede que en ella solo se iniciara sesión,
            o que sea anterior al registro de procesos por sesión: las sesiones abiertas
            antes de ese cambio no llevan el identificador que los ata.
          </p>
          {session.user_id !== null && (
            <Link
              to={`/auditoria/procesos?usuario=${session.user_id}`}
              className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
            >
              Ver todo el historial de esta persona
              <ExternalLink size={13} />
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Sin la columna de persona: en una sesión la persona es siempre la misma. */}
          <ProcessHistoryTable
            rows={rows}
            loading={false}
            showActor={false}
            emptyMessage="No hay procesos atados a esta sesión."
          />
          {total > rows.length && (
            <p className="text-sm text-slate-500">
              Se muestran los {rows.length} procesos más recientes de {total}.{' '}
              {session.user_id !== null && (
                <Link
                  to={`/auditoria/procesos?usuario=${session.user_id}`}
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Ver el historial completo de la persona
                </Link>
              )}
            </p>
          )}
        </>
      )}
    </div>
  )
}
