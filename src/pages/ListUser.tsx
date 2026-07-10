import { useEffect, useState, useCallback } from 'react'
import { FileDown, UserPlus } from 'lucide-react'
import { Pencil, Trash2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { userApi, roleApi } from '../api/user'
import type { UserAccount, Role } from '../types/user'
import { useAuth } from '../context/AuthContext'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { UserFormModal } from '../components/UserFormModal'
import type { RoleName } from '../types/user'

const ROLE_LABEL: Record<RoleName, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN:       'Admin',
  TAQUILLERO:  'Taquillero',
}

const ROLE_VARIANT: Record<RoleName, 'info' | 'warning' | 'neutral'> = {
  SUPER_ADMIN: 'info',
  ADMIN:       'warning',
  TAQUILLERO:  'neutral',
}

export function ListUser() {
  const { user: currentUser } = useAuth()

  const [rows,          setRows]         = useState<UserAccount[]>([])
  const [roles,         setRoles]        = useState<Role[]>([])
  const [loading,       setLoading]      = useState(true)
  const [error,         setError]        = useState<string | null>(null)
  const [search,        setSearch]       = useState('')
  const [selectedStatus, setStatus]      = useState('all')
  const [selectedRole,  setRole]         = useState('all')
  const [formOpen,      setFormOpen]     = useState(false)
  const [editingRow,    setEditingRow]   = useState<UserAccount | null>(null)
  const [deleteTarget,  setDeleteTarget] = useState<UserAccount | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await userApi.list()
      setRows(data)
      setError(null)
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const [users, roleList] = await Promise.all([userApi.list(), roleApi.list()])
        setRows(users)
        setRoles(roleList)
      } catch (err: any) {
        setError(err.message ?? 'Error al cargar los datos')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const openCreate = () => { setEditingRow(null); setFormOpen(true) }
  const openEdit   = (row: UserAccount) => { setEditingRow(row); setFormOpen(true) }

  function exportPdf() {
    const doc = new jsPDF()
    doc.text('Directorio de Usuarios', 14, 15)
    autoTable(doc, {
      startY: 22,
      head: [['Nombre', 'Correo', 'Rol', 'Estado']],
      body: filtered.map((r) => [
        r.name,
        r.email,
        ROLE_LABEL[r.role.name],
        r.is_active ? 'Activo' : 'Inactivo',
      ]),
    })
    doc.save('usuarios.pdf')
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await userApi.remove(deleteTarget.id)
      setDeleteTarget(null)
      await refetch()
    } catch (err: any) {
      setError(err.message ?? 'Error al eliminar el usuario')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const statusOptions = [
    { value: 'all',   label: 'Todos los estados' },
    { value: 'true',  label: 'Activo'             },
    { value: 'false', label: 'Inactivo'            },
  ]

  const roleOptions = [
    { value: 'all',        label: 'Todos los roles' },
    { value: 'SUPER_ADMIN', label: 'Super Admin'    },
    { value: 'ADMIN',      label: 'Admin'           },
    { value: 'TAQUILLERO', label: 'Taquillero'      },
  ]

  const filtered = rows.filter((r) => {
    const matchStatus = selectedStatus === 'all' || String(r.is_active) === selectedStatus
    const matchRole   = selectedRole   === 'all' || r.role.name === selectedRole
    const matchSearch = search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchRole && matchSearch
  })

  const columns: ColumnDef<UserAccount>[] = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (_, row) => <span className="font-medium text-slate-800">{row.name}</span>,
    },
    {
      key: 'email',
      header: 'Correo',
      render: (_, row) => <span className="text-slate-500">{row.email}</span>,
    },
    {
      key: 'role',
      header: 'Rol',
      sortable: true,
      render: (_, row) => (
        <Badge variant={ROLE_VARIANT[row.role.name]}>{ROLE_LABEL[row.role.name]}</Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (_, row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  const canEdit   = currentUser?.role.name !== 'TAQUILLERO'
  const canDelete = currentUser?.role.name === 'SUPER_ADMIN'

  return (
    <div>
      <PageHeader
        title="Directorio de Usuarios"
        subtitle={`${filtered.length} usuario${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
        actions={
          <>
            {canEdit && (
              <Button variant="primary" leftIcon={<UserPlus size={15} />} size="sm" onClick={openCreate}>
                Nuevo Usuario
              </Button>
            )}
            <Button variant="secondary" leftIcon={<FileDown size={15} />} size="sm" onClick={exportPdf}>
              Exportar PDF
            </Button>
          </>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Error: {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput
          placeholder="Buscar por nombre o correo..."
          fullWidth={false}
          className="w-full sm:w-64"
          onSearch={setSearch}
          debounceMs={200}
        />
        <Select
          options={statusOptions}
          value={selectedStatus}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full sm:w-44"
        />
        <Select
          options={roleOptions}
          value={selectedRole}
          onChange={(e) => setRole(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      <Table<UserAccount>
        columns={columns}
        rows={filtered}
        keyField="id"
        loading={loading}
        emptyMessage="No hay usuarios para los filtros seleccionados."
        actions={(row) => (
          <>
            {canEdit && (
              <button
                type="button"
                title="Editar"
                className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                onClick={() => openEdit(row)}
              >
                <Pencil size={14} />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                title="Eliminar"
                className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                onClick={() => setDeleteTarget(row)}
              >
                <Trash2 size={14} />
              </button>
            )}
          </>
        )}
      />

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={refetch}
        initial={editingRow}
        roles={roles}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar usuario"
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
          <span className="font-semibold text-slate-900">{deleteTarget?.name}</span>?{' '}
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
