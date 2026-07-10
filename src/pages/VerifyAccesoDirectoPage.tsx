import { useEffect, useRef, useState } from 'react'
import { Search, CheckCircle2, XCircle, Star } from 'lucide-react'
import { accesoDirectoApi } from '../api/acceso_directo'
import type { AccesoDirectoVerifyResult } from '../types/acceso_directo'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'

const STATUS_LABEL: Record<string, string> = {
  ACTIVE:    'Activo',
  SUSPENDED: 'Suspendido',
  INACTIVE:  'Inactivo',
}

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'neutral'> = {
  ACTIVE:    'success',
  SUSPENDED: 'danger',
  INACTIVE:  'neutral',
}

/** Tiempo que el aviso emergente permanece visible antes de cerrarse solo. */
const POPUP_MS = 5000

type Popup =
  | { kind: 'result'; data: AccesoDirectoVerifyResult }
  | { kind: 'not-found'; query: string }

export function VerifyAccesoDirectoPage() {
  const [query,   setQuery]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [popup,   setPopup]   = useState<Popup | null>(null)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-cierre del aviso emergente a los 5 segundos.
  useEffect(() => {
    if (!popup) return
    timerRef.current = setTimeout(() => setPopup(null), POPUP_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [popup])

  async function handleVerify() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setError(null)
    setPopup(null)
    try {
      const data = await accesoDirectoApi.verify(q)
      setPopup({ kind: 'result', data })
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if (e.status === 404) {
        setPopup({ kind: 'not-found', query: q })
      } else {
        setError(e.message ?? 'Error al consultar')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleVerify()
  }

  const result = popup?.kind === 'result' ? popup.data : null
  const isActive = result?.status === 'ACTIVE'
  // Verde solo cuando la persona tiene acceso directo y está activa.
  const isGranted = isActive

  return (
    <div className="p-6 max-w-lg mx-auto">
      <PageHeader
        breadcrumb="Comedor"
        title="Verificar Acceso Directo"
        subtitle="Consulta si una persona está registrada en la lista de accesos directos."
      />

      <Card variant="outlined" padding="lg">
        <div className="flex gap-2">
          <Input
            placeholder="Cédula o código de carnet..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1"
          />
          <Button
            variant="primary"
            onClick={() => void handleVerify()}
            loading={loading}
            disabled={!query.trim()}
          >
            <Search size={16} />
          </Button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          El resultado aparecerá como un aviso a pantalla completa que se cierra
          automáticamente luego de 5 segundos.
        </p>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </Card>

      {/* Aviso emergente (pop-up de 5 s) ───────────────────────────── */}
      {popup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6"
          onClick={() => setPopup(null)}
          role="alert"
        >
          <div
            className={[
              'w-full max-w-md rounded-2xl border-4 bg-white p-8 text-center shadow-2xl',
              popup.kind === 'result' && isGranted
                ? 'border-green-500'
                : 'border-red-500',
            ].join(' ')}
            onClick={(e) => e.stopPropagation()}
          >
            {popup.kind === 'result' ? (
              <>
                {popup.data.photo_url ? (
                  <img
                    src={popup.data.photo_url}
                    alt={`${popup.data.first_name} ${popup.data.last_name}`}
                    className={[
                      'mx-auto h-24 w-24 sm:h-36 sm:w-36 rounded-full border-4 object-cover',
                      isGranted ? 'border-green-500' : 'border-red-500',
                    ].join(' ')}
                  />
                ) : isGranted ? (
                  <CheckCircle2 size={88} className="mx-auto text-green-500" />
                ) : (
                  <XCircle size={88} className="mx-auto text-red-500" />
                )}

                <p className="mt-4 text-2xl sm:text-3xl font-bold text-slate-800">
                  {popup.data.first_name} {popup.data.last_name}
                </p>
                <p className="mt-1 text-base text-slate-500">
                  Cédula: {popup.data.document_id}
                </p>

                <p
                  className={[
                    'mt-5 text-xl sm:text-2xl font-extrabold uppercase tracking-wide',
                    isGranted ? 'text-green-600' : 'text-red-600',
                  ].join(' ')}
                >
                  {isGranted ? 'Acceso permitido' : 'Acceso denegado'}
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <Badge variant={STATUS_VARIANT[popup.data.status]}>
                    {STATUS_LABEL[popup.data.status]}
                  </Badge>
                  {popup.data.is_priority && (
                    <Badge variant="warning">
                      <Star size={11} className="mr-1 inline" />
                      Prioritario
                    </Badge>
                  )}
                  {popup.data.access_reason && (
                    <Badge variant="info">{popup.data.access_reason.name}</Badge>
                  )}
                </div>

                {!isGranted && (
                  <p className="mt-4 text-sm text-red-700">
                    {popup.data.status === 'SUSPENDED'
                      ? 'Este acceso directo se encuentra suspendido y no puede acceder al comedor.'
                      : 'Este acceso directo está inactivo.'}
                  </p>
                )}
              </>
            ) : (
              <>
                <XCircle size={88} className="mx-auto text-red-500" />
                <p className="mt-4 text-2xl sm:text-3xl font-bold text-slate-800">No encontrado</p>
                <p className="mt-2 text-base text-slate-500">
                  La cédula <span className="font-mono">{popup.query}</span> no está
                  registrada como acceso directo.
                </p>
                <p className="mt-5 text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-red-600">
                  Acceso denegado
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
