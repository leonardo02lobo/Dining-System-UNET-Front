import { useEffect, useState, useCallback } from 'react'
import { Pencil, Trash2, PlusCircle, MapPin } from 'lucide-react'
import { sedesApi } from '../api/sedes'
import type { Sede, SedeCreate, SedeUpdate } from '../types/sede'
import { useAuth } from '../context/AuthContext'
import { notify } from '../utils/toast'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'

const EMPTY_FORM: SedeCreate = { name: '', description: '', address: '', is_active: true }

export function SedesPage() {
  const { user: currentUser } = useAuth()
  const [rows,          setRows]          = useState<Sede[]>([])
  const [total,         setTotal]         = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [formOpen,      setFormOpen]      = useState(false)
  const [editingRow,    setEditingRow]    = useState<Sede | null>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<Sede | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [form,          setForm]          = useState<SedeCreate>(EMPTY_FORM)
  const [saving,        setSaving]        = useState(false)
  const [formError,     setFormError]     = useState<string | null>(null)

  const canManage = currentUser?.role.name === 'SUPER_ADMIN' || currentUser?.role.name === 'ADMIN'

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await sedesApi.list()
      setRows(result.items)
      setTotal(result.total)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refetch() }, [refetch])

  function openCreate() {
    setEditingRow(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setFormOpen(true)
  }

  function openEdit(row: Sede) {
    setEditingRow(row)
    setForm({ name: row.name, description: row.description ?? '', address: row.address ?? '', is_active: row.is_active })
    setFormError(null)
    setFormOpen(true)
  }

  async function handleSave() {
    if (!form.name?.trim()) { setFormError('El nombre es obligatorio'); return }
    setSaving(true)
    setFormError(null)
    try {
      if (editingRow) {
        const payload: SedeUpdate = {
          name:        form.name,
          description: form.description || undefined,
          address:     form.address || undefined,
          is_active:   form.is_active,
        }
        await sedesApi.update(editingRow.id, payload)
        notify.success('Sede actualizada.')
      } else {
        await sedesApi.create(form)
        notify.success('Sede creada.')
      }
      setFormOpen(false)
      await refetch()
    } catch (err: unknown) {
      const e = err as { message?: string }
      setFormError(e.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await sedesApi.deactivate(deleteTarget.id)
      setDeleteTarget(null)
      notify.success('Sede desactivada.')
      await refetch()
    } catch (err) {
      notify.error(err)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const columns: ColumnDef<Sede>[] = [
    {
      key: 'name',
      header: 'Nombre',
      sortable: true,
      render: (_, row) => (
        <span className="flex items-center gap-1.5 font-medium text-slate-800">
          <MapPin size={13} className="text-blue-500" />
          {row.name}
        </span>
      ),
    },
    {
      key: 'address',
      header: 'Dirección',
      render: (_, row) => <span className="text-slate-500">{row.address ?? '—'}</span>,
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (_, row) => <span className="text-slate-500">{row.description ?? '—'}</span>,
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (_, row) => (
        <Badge variant={row.is_active ? 'success' : 'neutral'}>
          {row.is_active ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sedes"
        subtitle={`${total} sede${total !== 1 ? 's' : ''} registrada${total !== 1 ? 's' : ''}`}
        actions={
          canManage ? (
            <Button variant="primary" leftIcon={<PlusCircle size={15} />} size="sm" onClick={openCreate}>
              Nueva Sede
            </Button>
          ) : undefined
        }
      />

      <Table<Sede>
        columns={columns}
        rows={rows}
        keyField="id"
        loading={loading}
        emptyMessage="No hay sedes registradas."
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
                    title="Desactivar"
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

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editingRow ? 'Editar Sede' : 'Nueva Sede'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={() => void handleSave()} loading={saving}>
              {editingRow ? 'Guardar cambios' : 'Crear sede'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </div>
          )}
          <Input
            label="Nombre *"
            value={form.name ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Ej. Sede Principal"
          />
          <Input
            label="Dirección"
            value={form.address ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
            placeholder="Ej. Av. Universidad, Edificio A"
          />
          <Input
            label="Descripción"
            value={form.description ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Ej. Comedor ubicado en el campus principal"
          />
          {editingRow && (
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-blue-600"
                checked={form.is_active ?? true}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              <span className="text-sm font-medium text-slate-800">Sede activa</span>
            </label>
          )}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Desactivar sede"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={() => void confirmDelete()} loading={deleteLoading}>
              Desactivar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Deseas desactivar la sede{' '}
          <span className="font-semibold text-slate-900">{deleteTarget?.name}</span>?
          Podrás reactivarla editándola más adelante.
        </p>
      </Modal>
    </div>
  )
}
