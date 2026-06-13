import { useState } from 'react'
import { Search, CheckCircle2, XCircle, Star } from 'lucide-react'
import { beneficiaryApi } from '../api/beneficiary'
import type { BeneficiaryVerifyResult } from '../types/beneficiary'
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

export function VerifyBeneficiaryPage() {
  const [query,   setQuery]   = useState('')
  const [result,  setResult]  = useState<BeneficiaryVerifyResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleVerify() {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setResult(null)
    setNotFound(false)
    setError(null)
    try {
      const data = await beneficiaryApi.verify(q)
      setResult(data)
    } catch (err: unknown) {
      const e = err as { status?: number; message?: string }
      if (e.status === 404) {
        setNotFound(true)
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

  const isActive = result?.status === 'ACTIVE'

  return (
    <div className="p-6 max-w-lg mx-auto">
      <PageHeader
        breadcrumb="Comedor"
        title="Verificar Beneficiario"
        subtitle="Consulta si una persona está registrada en la lista de beneficiarios."
      />

      <Card variant="outlined" padding="lg">
        <div className="flex gap-2">
          <Input
            placeholder="Cédula o código de carnet..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setResult(null)
              setNotFound(false)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
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

        {/* Resultado */}
        {result && (
          <div className="mt-5 flex flex-col gap-3">
            <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${isActive ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              {isActive
                ? <CheckCircle2 size={28} className="flex-shrink-0 text-green-600" />
                : <XCircle     size={28} className="flex-shrink-0 text-red-500"   />
              }
              <div>
                <p className="font-semibold text-slate-800">
                  {result.first_name} {result.last_name}
                </p>
                <p className="text-sm text-slate-500">Cédula: {result.document_id}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Estado:</span>
              <Badge variant={STATUS_VARIANT[result.status]}>
                {STATUS_LABEL[result.status]}
              </Badge>
              {result.is_priority && (
                <Badge variant="warning">
                  <Star size={11} className="mr-1 inline" />
                  VIP
                </Badge>
              )}
            </div>

            {!isActive && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {result.status === 'SUSPENDED'
                  ? 'Este beneficiario se encuentra suspendido y no puede acceder al comedor.'
                  : 'Este beneficiario está inactivo.'}
              </p>
            )}
          </div>
        )}

        {notFound && (
          <div className="mt-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <XCircle size={28} className="flex-shrink-0 text-slate-400" />
            <div>
              <p className="font-semibold text-slate-700">No encontrado</p>
              <p className="text-sm text-slate-500">
                La cédula <span className="font-mono">{query}</span> no está registrada como beneficiario.
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </Card>
    </div>
  )
}
