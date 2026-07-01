import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { sanctionApi } from '../api/sanction'
import type { SuspendedAccesoDirecto } from '../types/sanction'
import { useAuth } from '../context/AuthContext'
import { notify } from '../utils/toast'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'

const USER_TYPE_LABEL: Record<string, string> = {
  STUDENT:        'Estudiante',
  TEACHER:        'Docente',
  ADMINISTRATIVE: 'Administrativo',
  WORKER:         'Obrero',
}

export function SuspendedListPage() {
  const { user } = useAuth()
  const canManage = user?.role.name === 'SUPER_ADMIN' || user?.role.name === 'ADMIN'

  const [rows,    setRows]    = useState<SuspendedAccesoDirecto[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  const [liftTarget,  setLiftTarget]  = useState<SuspendedAccesoDirecto | null>(null)
  const [liftLoading, setLiftLoading] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await sanctionApi.suspended({ search: search || undefined })
      setRows(result.items)
      setTotal(result.total)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => { void refetch() }, [refetch])

  async function confirmLift() {
    if (!liftTarget) return
    setLiftLoading(true)
    try {
      await sanctionApi.lift(liftTarget.acceso_directo_id)
      notify.success('Suspensión levantada. El usuario fue reactivado.')
      setLiftTarget(null)
      await refetch()
    } catch (err) {
      notify.error(err)
      setLiftTarget(null)
    } finally {
      setLiftLoading(false)
    }
  }

  const columns: ColumnDef<SuspendedAccesoDirecto>[] = [
    {
      key: 'document_id',
      header: 'Cédula',
      render: (_, row) => <span className="font-medium text-slate-800">{row.document_id}</span>,
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (_, row) => <span className="text-slate-700">{row.first_name} {row.last_name}</span>,
    },
    {
      key: 'user_type',
      header: 'Tipo',
      render: (_, row) => (
        <Badge variant="info">{USER_TYPE_LABEL[row.user_type] ?? row.user_type}</Badge>
      ),
    },
    {
      key: 'reason',
      header: 'Motivo',
      render: (_, row) => <span className="text-slate-600">{row.reason}</span>,
    },
    {
      key: 'start_date',
      header: 'Suspendido desde',
      render: (_, row) => <span className="text-slate-500">{row.start_date}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Usuarios Suspendidos"
        subtitle={`${total} usuario${total !== 1 ? 's' : ''} con suspensión activa`}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput
          placeholder="Buscar por nombre o cédula..."
          fullWidth={false}
          className="w-64"
          onSearch={setSearch}
          debounceMs={300}
        />
      </div>

      <Table<SuspendedAccesoDirecto>
        columns={columns}
        rows={rows}
        keyField="sanction_id"
        loading={loading}
        emptyMessage="No hay usuarios suspendidos."
        actions={
          canManage
            ? (row) => (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<ShieldCheck size={14} />}
                  onClick={() => setLiftTarget(row)}
                >
                  Levantar
                </Button>
              )
            : undefined
        }
      />

      <Modal
        open={!!liftTarget}
        onClose={() => setLiftTarget(null)}
        title="Levantar suspensión"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setLiftTarget(null)} disabled={liftLoading}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={confirmLift} loading={liftLoading}>
              Levantar suspensión
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Deseas levantar la suspensión de{' '}
          <span className="font-semibold text-slate-900">
            {liftTarget?.first_name} {liftTarget?.last_name}
          </span>
          ? El usuario podrá volver a registrar consumo de inmediato.
        </p>
      </Modal>
    </div>
  )
}
