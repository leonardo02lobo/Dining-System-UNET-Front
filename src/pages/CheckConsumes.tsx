import { useEffect, useRef, useState } from 'react'
import { Search, ScanLine, CheckCircle2, XCircle } from 'lucide-react'
import { normalizeCedula } from '../utils/cedula'
import { beneficiaryApi } from '../api/beneficiary'
import { consumptionApi } from '../api/consumption'
import { lunchSessionApi } from '../api/lunchSession'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import type { Beneficiary } from '../types/beneficiary'
import type { LunchSession } from '../types/lunchSession'
import type { ConsumptionCheckResult } from '../types/consumption'

const USER_TYPE_LABEL: Record<string, string> = {
  STUDENT: 'Estudiante',
  TEACHER: 'Docente',
  ADMINISTRATIVE: 'Administrativo',
  WORKER: 'Obrero',
}

export function CheckConsumes() {
  const [session, setSession] = useState<LunchSession | null | undefined>(undefined)
  const [cedula, setCedula] = useState('')
  const [beneficiary, setBeneficiary] = useState<Beneficiary | null>(null)
  const [checkResult, setCheckResult] = useState<ConsumptionCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const lastKeyAtRef = useRef(0)
  const bufferRef = useRef('')

  useEffect(() => {
    lunchSessionApi.today()
      .then((s) => setSession(s))
      .catch(() => setSession(null))
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const now = Date.now()
      if (now - lastKeyAtRef.current > 60) bufferRef.current = ''

      if (e.key === 'Enter') {
        const scanned = bufferRef.current.trim()
        if (scanned.length >= 6) {
          setCedula(scanned)
          void triggerSearch(scanned)
        }
        bufferRef.current = ''
        lastKeyAtRef.current = now
        return
      }
      if (e.key.length === 1) {
        bufferRef.current += e.key
        lastKeyAtRef.current = now
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function triggerSearch(value: string) {
    const clean = normalizeCedula(value)
    if (!clean) return
    setCedula(clean)
    setLoading(true)
    setError(null)
    setSearched(true)
    setBeneficiary(null)
    setCheckResult(null)
    try {
      const b = await beneficiaryApi.lookup(clean)
      setBeneficiary(b)
      const check = await consumptionApi.check(b.id)
      setCheckResult(check)
    } catch (err: any) {
      setError('Error al consultar el beneficiario')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() { void triggerSearch(cedula) }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  const noSession = session === null

  return (
    <div>
      <PageHeader
        title="Consultar Comedor"
        subtitle="Busca un beneficiario por su cédula o carnet"
      />

      {noSession && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          No hay una sesión de almuerzo activa hoy.
        </div>
      )}

      <Card variant="outlined" padding="md" className="mb-6">
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
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <ScanLine size={13} />
          El lector de código de barras enviará el código automáticamente al pasar el carnet.
        </p>
      </Card>

      {loading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && searched && !beneficiary && !error && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          No se encontró ningún beneficiario con la cédula <strong>{cedula}</strong>.
        </div>
      )}

      {!loading && beneficiary && (
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col items-start gap-6 sm:flex-row">
            <Avatar name={`${beneficiary.first_name} ${beneficiary.last_name}`} />

            <div className="flex flex-1 flex-col gap-4 text-sm">
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Documento</p>
                <Input value={beneficiary.document_id} readOnly fullWidth />
              </div>
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Nombre</p>
                <Input value={`${beneficiary.first_name} ${beneficiary.last_name}`} readOnly fullWidth />
              </div>
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Carrera</p>
                <Input value={beneficiary.career ?? '—'} readOnly fullWidth />
              </div>
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Tipo de Usuario</p>
                <Input value={USER_TYPE_LABEL[beneficiary.user_type] ?? beneficiary.user_type} readOnly fullWidth />
              </div>
              <div className="flex flex-row items-center gap-14">
                <p className="w-48 text-xs uppercase tracking-wide text-slate-400">Estado</p>
                <Badge variant={beneficiary.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {beneficiary.status === 'ACTIVE' ? 'Activo' : beneficiary.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                </Badge>
              </div>
              {checkResult !== null && (
                <div className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm ${checkResult.has_consumed_today
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-green-200 bg-green-50 text-green-700'
                  }`}>
                  {checkResult.has_consumed_today
                    ? <><XCircle size={16} /> Ya consumió hoy {checkResult.consumption?.registered_at ? `a las ${new Date(checkResult.consumption.registered_at).toLocaleTimeString()}` : ''}</>
                    : <><CheckCircle2 size={16} /> No ha consumido en la sesión de hoy</>
                  }
                </div>
              )}

              {checkResult?.active_sanction && (
                <div className="flex items-center gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <XCircle size={16} />
                  Sanción activa: {checkResult.active_sanction.reason}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
