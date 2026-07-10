import { useEffect, useState, useCallback } from 'react'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { accesoDirectoApi } from '../api/acceso_directo'
import { accessReasonApi } from '../api/accessReason'
import type { AccesoDirecto, AccesoDirectoStatus, AccessReason, UserType } from '../types/acceso_directo'
import { useAuth } from '../context/AuthContext'
import { notify } from '../utils/toast'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { AccesoDirectoFormModal } from '../components/AccesoDirectoFormModal'

const STATUS_LABEL: Record<AccesoDirectoStatus, string> = {
  ACTIVE:    'Activo',
  SUSPENDED: 'Suspendido',
  INACTIVE:  'Inactivo',
}

const STATUS_VARIANT: Record<AccesoDirectoStatus, 'success' | 'danger' | 'neutral'> = {
  ACTIVE:    'success',
  SUSPENDED: 'danger',
  INACTIVE:  'neutral',
}

const USER_TYPE_LABEL: Record<UserType, string> = {
  STUDENT:        'Estudiante',
  TEACHER:        'Docente',
  ADMINISTRATIVE: 'Administrativo',
  WORKER:         'Obrero',
}

const USER_TYPE_VARIANT: Record<UserType, 'info' | 'warning' | 'neutral' | 'success'> = {
  STUDENT:        'info',
  TEACHER:        'warning',
  ADMINISTRATIVE: 'neutral',
  WORKER:         'success',
}

export function AccesoDirectoPage() {
  const { user: currentUser } = useAuth()

  const [rows,          setRows]         = useState<AccesoDirecto[]>([])
  const [total,         setTotal]        = useState(0)
  const [loading,       setLoading]      = useState(true)
  const [search,        setSearch]       = useState('')
  const [selectedStatus, setStatus]      = useState<string>('all')
  const [selectedType,  setType]         = useState<string>('all')
  const [selectedReason, setReason]      = useState<string>('all')
  const [reasons,       setReasons]      = useState<AccessReason[]>([])
  const [formOpen,      setFormOpen]     = useState(false)
  const [editingRow,    setEditingRow]   = useState<AccesoDirecto | null>(null)
  const [deleteTarget,  setDeleteTarget] = useState<AccesoDirecto | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const canManage = currentUser?.role.name === 'SUPER_ADMIN' || currentUser?.role.name === 'ADMIN'

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await accesoDirectoApi.list({
        search:    search || undefined,
        status:    selectedStatus !== 'all' ? (selectedStatus as AccesoDirectoStatus) : undefined,
        user_type: selectedType  !== 'all' ? (selectedType as UserType) : undefined,
        access_reason_id: selectedReason !== 'all' ? Number(selectedReason) : undefined,
        limit: 100,
      })
      setRows(result.items)
      setTotal(result.total)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, selectedStatus, selectedType, selectedReason])

  useEffect(() => { void refetch() }, [refetch])

  // Carga los motivos/roles para el filtro de búsqueda por grupo/rol.
  useEffect(() => {
    accessReasonApi
      .list()
      .then(setReasons)
      .catch(() => setReasons([]))
  }, [])

  const openCreate = () => { setEditingRow(null); setFormOpen(true) }
  const openEdit   = (row: AccesoDirecto) => { setEditingRow(row); setFormOpen(true) }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await accesoDirectoApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      notify.success('Acceso directo eliminado.')
      await refetch()
    } catch (err) {
      notify.error(err)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const statusOptions = [
    { value: 'all',       label: 'Todos los estados' },
    { value: 'ACTIVE',    label: 'Activo'             },
    { value: 'SUSPENDED', label: 'Suspendido'         },
    { value: 'INACTIVE',  label: 'Inactivo'           },
  ]

  const typeOptions = [
    { value: 'all',            label: 'Todos los tipos' },
    { value: 'STUDENT',        label: 'Estudiante'      },
    { value: 'TEACHER',        label: 'Docente'         },
    { value: 'ADMINISTRATIVE', label: 'Administrativo'  },
    { value: 'WORKER',         label: 'Obrero'          },
  ]

  const reasonOptions = [
    { value: 'all', label: 'Todos los motivos' },
    ...reasons.map((r) => ({ value: String(r.id), label: r.name })),
  ]

  const columns: ColumnDef<AccesoDirecto>[] = [
    {
      key: 'first_name',
      header: 'Nombre',
      sortable: true,
      render: (_, row) => (
        <span className="font-medium text-slate-800">
          {row.first_name} {row.last_name}
        </span>
      ),
    },
    {
      key: 'document_id',
      header: 'Cédula',
      render: (_, row) => <span className="text-slate-500">{row.document_id}</span>,
    },
    {
      key: 'card_code',
      header: 'Carnet',
      render: (_, row) => <span className="text-slate-500">{row.card_code}</span>,
    },
    {
      key: 'user_type',
      header: 'Tipo',
      sortable: true,
      render: (_, row) => (
        <Badge variant={USER_TYPE_VARIANT[row.user_type]}>
          {USER_TYPE_LABEL[row.user_type]}
        </Badge>
      ),
    },
    {
      key: 'access_reason',
      header: 'Motivo',
      render: (_, row) =>
        row.access_reason ? (
          <Badge variant="info">{row.access_reason.name}</Badge>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (_, row) => (
        <Badge variant={STATUS_VARIANT[row.status]}>
          {STATUS_LABEL[row.status]}
        </Badge>
      ),
    },
    {
      key: 'is_priority',
      header: 'Prioritario',
      render: (_, row) =>
        row.is_priority ? <Badge variant="warning">Prioritario</Badge> : null,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Accesos Directos"
        subtitle={`${total} acceso${total !== 1 ? 's' : ''} directo${total !== 1 ? 's' : ''} en total`}
        actions={
          canManage ? (
            <Button variant="primary" leftIcon={<UserPlus size={15} />} size="sm" onClick={openCreate}>
              Nuevo Acceso Directo
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput
          placeholder="Buscar por nombre o cédula..."
          fullWidth={false}
          className="w-full sm:w-64"
          onSearch={setSearch}
          debounceMs={300}
        />
        <Select
          options={statusOptions}
          value={selectedStatus}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-44"
        />
        <Select
          options={typeOptions}
          value={selectedType}
          onChange={(e) => setType(e.target.value)}
          className="w-full sm:w-44"
        />
        <Select
          options={reasonOptions}
          value={selectedReason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      <Table<AccesoDirecto>
        columns={columns}
        rows={rows}
        keyField="id"
        loading={loading}
        emptyMessage="No hay accesos directos para los filtros seleccionados."
        actions={
          canManage
            ? (row) => (
                <>
                  <button
                    type="button"
                    title="Editar"
                    className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    onClick={() => openEdit(row)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )
            : undefined
        }
      />

      <AccesoDirectoFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={refetch}
        initial={editingRow}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar acceso directo"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleteLoading}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar a{' '}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.first_name} {deleteTarget?.last_name}
          </span>
          ? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
