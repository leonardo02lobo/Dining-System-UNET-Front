import { useEffect, useState, type ReactNode } from 'react'
import { Search, ScanLine, CheckCircle2, XCircle, MinusCircle, ShieldCheck } from 'lucide-react'
import { normalizeCedula } from '../utils/cedula'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'
import { accesoDirectoApi } from '../api/acceso_directo'
import { externalStudentApi, mapExternalToStudent } from '../api/externalStudent'
import { consumptionApi } from '../api/consumption'
import { sanctionApi } from '../api/sanction'
import { lunchSessionApi } from '../api/lunchSession'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { StudentResultCard } from '../components/StudentResultCard'
import { Spinner } from '../components/ui/Spinner'
import type { Student } from '../types/user'
import type { ConsumptionCheckResult } from '../types/consumption'

/**
 * Caja de estado de la ficha (consumo del día / sanción). `variant` neutro es el
 * estado "todavía sin dato", que se usa mientras no hay una consulta con
 * resultado, para no afirmar nada sobre una persona que no se ha buscado.
 */
function StatusBox({
  variant,
  icon,
  children,
}: {
  variant: 'neutral' | 'success' | 'warning' | 'danger'
  icon: ReactNode
  children: ReactNode
}) {
  const variantClasses = {
    neutral: 'border-slate-200 bg-slate-50 text-slate-500',
    success: 'border-green-200 bg-green-50 text-green-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    danger:  'border-red-200 bg-red-50 text-red-700',
  }[variant]

  return (
    <div className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm ${variantClasses}`}>
      {icon}
      {children}
    </div>
  )
}

export function CheckConsumes() {
  const [hasOpenSessions, setHasOpenSessions] = useState<boolean | undefined>(undefined)
  const [cedula,      setCedula]      = useState('')
  const [student,     setStudent]     = useState<Student | null>(null)
  const [checkResult, setCheckResult] = useState<ConsumptionCheckResult | null>(null)
  const [suspensionCount, setSuspensionCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    lunchSessionApi.openList()
      .then((r) => setHasOpenSessions(r.total > 0))
      .catch(() => setHasOpenSessions(false))
  }, [])

  useBarcodeScanner((scanned) => {
    setCedula(scanned)
    void triggerSearch(scanned)
  })

  async function triggerSearch(value: string) {
    const clean = normalizeCedula(value)
    if (!clean) return
    setCedula(clean)
    setLoading(true)
    setError(null)
    setSearched(true)
    setStudent(null)
    setCheckResult(null)
    setSuspensionCount(null)
    try {
      const ext = await externalStudentApi.lookup(clean)
      setStudent(mapExternalToStudent(ext))
      try {
        const b = await accesoDirectoApi.lookup(clean)
        const check = await consumptionApi.check(b.id)
        setCheckResult(check)
        try {
          const history = await sanctionApi.history(b.id)
          setSuspensionCount(history.total)
        } catch {
          // El conteo de suspensiones es informativo: si falla, no bloquea la consulta.
        }
      } catch {
        // Student not in internal system — consumption check unavailable
      }
    } catch (err: any) {
      setError(err.message ?? 'Error al consultar el estudiante')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() { void triggerSearch(cedula) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  const noSession = hasOpenSessions === false

  // Las dos cajas de estado existen desde el inicio. Mientras no hay una consulta
  // resuelta se muestran en neutro: la ausencia de dato NO se dibuja como "sin
  // sanción" ni "no ha consumido", que serían afirmaciones sobre alguien que
  // todavía no se ha buscado.
  const consumptionStatus = loading ? null : !student ? (
    <StatusBox variant="neutral" icon={<MinusCircle size={16} />}>
      Consulta una cédula para ver el consumo del día.
    </StatusBox>
  ) : checkResult === null ? (
    <StatusBox variant="neutral" icon={<MinusCircle size={16} />}>
      Esta persona no tiene acceso directo: no hay registro de consumo asociado.
    </StatusBox>
  ) : checkResult.has_consumed_today ? (
    <StatusBox variant="warning" icon={<XCircle size={16} />}>
      Ya consumió hoy{checkResult.consumption?.registered_at
        ? ` a las ${new Date(checkResult.consumption.registered_at).toLocaleTimeString()}`
        : ''}
    </StatusBox>
  ) : (
    <StatusBox variant="success" icon={<CheckCircle2 size={16} />}>
      No ha consumido en la sesión de hoy
    </StatusBox>
  )

  const sanctionStatus = loading ? null : !student ? (
    <StatusBox variant="neutral" icon={<MinusCircle size={16} />}>
      Consulta una cédula para ver el estado de sanción.
    </StatusBox>
  ) : checkResult === null ? (
    <StatusBox variant="neutral" icon={<MinusCircle size={16} />}>
      Sin información de sanciones para esta persona.
    </StatusBox>
  ) : checkResult.active_sanction ? (
    <StatusBox variant="danger" icon={<XCircle size={16} />}>
      Sanción activa: {checkResult.active_sanction.reason}
    </StatusBox>
  ) : (
    <StatusBox variant="success" icon={<ShieldCheck size={16} />}>
      Sin sanción activa
    </StatusBox>
  )

  return (
    <div>
      <PageHeader
        title="Consultar Comedor"
        subtitle="Busca un acceso directo por su cédula o carnet"
      />

      {noSession && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay ninguna sesión de servicio de alimentación activa en este momento (en ninguna sede).
        </div>
      )}

      <Card variant="outlined" padding="md" className="mb-4">
        <div className="flex items-end gap-3">
          <Input
            id="cedula"
            label="Cédula o Carnet"
            placeholder="Escanea el carnet o escribe la cédula"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            onKeyDown={handleKeyDown}
            leftIcon={<Search size={16} />}
            fullWidth
          />
          <Button
            variant="primary"
            onClick={handleSearch}
            loading={loading}
            className="flex-shrink-0"
          >
            Consultar
          </Button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <ScanLine size={13} />
          El lector de código de barras enviará el código automáticamente al pasar el carnet.
        </p>
      </Card>

      {/* La ficha está montada siempre: en blanco al entrar y rellenada al
          consultar. Así la zona de información no aparece de golpe. */}
      <StudentResultCard
        student={loading ? null : student}
        showAccesoDirectoNotice={false}
        suspensionCount={suspensionCount}
        notice={
          <>
            {loading && (
              <div className="flex items-center justify-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <Spinner size="sm" />
                Consultando…
              </div>
            )}

            {!loading && error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {!loading && !error && searched && !student && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No se encontró ningún acceso directo con la cédula <strong>{cedula}</strong>.
              </div>
            )}

            {/* Consumo del día */}
            {consumptionStatus}

            {/* Estado de sanción */}
            {sanctionStatus}
          </>
        }
      />
    </div>
  )
}
