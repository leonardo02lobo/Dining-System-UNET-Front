import { useEffect, useState, useCallback } from 'react'
import { Clock, Pencil, RefreshCw, Trash2, UserPlus } from 'lucide-react'
import { accesoDirectoApi } from '../api/acceso_directo'
import { accessReasonApi } from '../api/accessReason'
import type {
  AccesoDirecto,
  AccesoDirectoRecentEntry,
  AccesoDirectoStatus,
  AccessReason,
  UserType,
} from '../types/acceso_directo'
import { useCan } from '../hooks/useCan'
import { notify } from '../utils/toast'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { AccesoDirectoFormModal } from '../components/AccesoDirectoFormModal'
import { USER_TYPE_LABEL } from '../utils/labels'

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


const USER_TYPE_VARIANT: Record<UserType, 'info' | 'warning' | 'neutral' | 'success'> = {
  STUDENT:        'info',
  TEACHER:        'warning',
  ADMINISTRATIVE: 'neutral',
  WORKER:         'success',
}

/** "Los últimos 10 que ingresaron". */
const RECENT_LIMIT = 10

interface RecentEntriesPanelProps {
  entries: AccesoDirectoRecentEntry[]
  total: number
  loading: boolean
  onlyPriority: boolean
  onToggleOnlyPriority: () => void
  onRefresh: () => void
}

/**
 * Últimos ingresos de personas del módulo.
 *
 * Sin *polling*: el refresco cada 15 s de Registro al Comedor existe porque varias
 * taquillas comparten sesión; esta es una pantalla de gestión y el botón basta.
 */
function RecentEntriesPanel({
  entries,
  total,
  loading,
  onlyPriority,
  onToggleOnlyPriority,
  onRefresh,
}: RecentEntriesPanelProps) {
  const columns: ColumnDef<AccesoDirectoRecentEntry>[] = [
    {
      key: 'first_name',
      header: 'Persona',
      render: (_, row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800">
            {row.first_name} {row.last_name}
          </span>
          <span className="text-xs text-slate-500">{row.document_id}</span>
        </div>
      ),
    },
    {
      key: 'user_type',
      header: 'Tipo',
      render: (_, row) =>
        row.user_type ? (
          <Badge variant={USER_TYPE_VARIANT[row.user_type]}>
            {USER_TYPE_LABEL[row.user_type]}
          </Badge>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: 'access_reason',
      header: 'Motivo',
      render: (_, row) =>
        row.access_reason ? (
          <Badge variant="info">{row.access_reason}</Badge>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: 'sede_name',
      header: 'Sede',
      render: (_, row) =>
        row.sede_name ? (
          <span className="text-slate-600">{row.sede_name}</span>
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    {
      key: 'is_manual',
      header: 'Origen',
      render: (_, row) => (
        <Badge variant={row.is_manual ? 'warning' : 'success'}>
          {row.is_manual ? 'Manual' : 'Taquilla'}
        </Badge>
      ),
    },
    {
      key: 'registered_at',
      header: 'Hora',
      render: (_, row) => (
        <span className="text-slate-500">
          {new Date(row.registered_at).toLocaleTimeString()}
        </span>
      ),
    },
  ]

  return (
    <Card variant="outlined" padding="md" className="mb-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Últimos ingresos</span>
          <span className="text-xs text-slate-500">
            {entries.length} de {total}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={onlyPriority}
              onChange={onToggleOnlyPriority}
              className="h-3.5 w-3.5 rounded border-slate-300"
            />
            Solo prioritarios
          </label>
          <Button variant="ghost" size="sm" onClick={onRefresh} leftIcon={<RefreshCw size={14} />}>
            Refrescar
          </Button>
        </div>
      </div>
      <Table<AccesoDirectoRecentEntry>
        columns={columns}
        rows={entries}
        keyField="consumption_id"
        loading={loading}
        emptyMessage="Todavía no hay ingresos registrados."
      />
    </Card>
  )
}

export function AccesoDirectoPage() {
  const { can } = useCan()

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

  // Panel de ingresos recientes: estado propio, deliberadamente desacoplado de los
  // filtros del padrón. Son dos preguntas distintas —quién está dado de alta y
  // quién acaba de entrar— y si el panel siguiera al buscador cambiaría al teclear.
  const [recentEntries, setRecentEntries] = useState<AccesoDirectoRecentEntry[]>([])
  const [recentTotal,   setRecentTotal]   = useState(0)
  const [recentLoading, setRecentLoading] = useState(true)
  const [onlyPriority,  setOnlyPriority]  = useState(false)

  const canManage = can('/accesos_directos')

  const refetchRecent = useCallback(async () => {
    setRecentLoading(true)
    try {
      const result = await accesoDirectoApi.recentEntries(RECENT_LIMIT, onlyPriority)
      setRecentEntries(result.items)
      setRecentTotal(result.total)
    } catch (err) {
      // Un panel informativo caído no debe impedir gestionar el padrón, que es la
      // función principal de la pantalla.
      notify.error(err)
      setRecentEntries([])
      setRecentTotal(0)
    } finally {
      setRecentLoading(false)
    }
  }, [onlyPriority])

  useEffect(() => { void refetchRecent() }, [refetchRecent])

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

  /** Un alta o una edición cambian tanto el padrón como lo que el panel puede mostrar. */
  const refetchAll = useCallback(async () => {
    await refetch()
    await refetchRecent()
  }, [refetch, refetchRecent])

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await accesoDirectoApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      notify.success('Acceso directo eliminado.')
      await refetchAll()
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

      <RecentEntriesPanel
        entries={recentEntries}
        total={recentTotal}
        loading={recentLoading}
        onlyPriority={onlyPriority}
        onToggleOnlyPriority={() => setOnlyPriority((v) => !v)}
        onRefresh={() => { void refetchRecent() }}
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
        onSave={refetchAll}
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
