import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { careerApi } from '../api/career'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type ColumnDef } from '../components/ui/Table'
import type { Career } from '../types/career'
import { notify } from '../utils/toast'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'
  return date.toLocaleDateString('es-VE')
}

export function CareerCatalogPage() {
  const { user } = useAuth()
  const canManage = user?.role.name === 'SUPER_ADMIN' || user?.role.name === 'ADMIN'

  const [careers, setCareers] = useState<Career[]>([])
  const [loading, setLoading] = useState(false)

  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [editTarget, setEditTarget] = useState<Career | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editActive, setEditActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<Career | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function loadCareers() {
    setLoading(true)
    try {
      setCareers(await careerApi.list())
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCareers()
  }, [])

  async function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) {
      setCreateError('Ingresa el nombre de la carrera.')
      return
    }

    setCreating(true)
    setCreateError('')
    try {
      const created = await careerApi.create({ name: trimmed, code: newCode.trim() || null })
      setCareers((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'es')))
      setNewName('')
      setNewCode('')
      notify.success('Carrera creada correctamente.')
    } catch (err: any) {
      setCreateError(err?.message ?? 'No se pudo crear la carrera.')
    } finally {
      setCreating(false)
    }
  }

  function openEditModal(career: Career) {
    setEditTarget(career)
    setEditName(career.name)
    setEditCode(career.code ?? '')
    setEditActive(career.is_active)
    setEditError('')
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    const trimmed = editName.trim()
    if (!trimmed) {
      setEditError('Ingresa el nombre de la carrera.')
      return
    }

    setSaving(true)
    setEditError('')
    try {
      const updated = await careerApi.update(editTarget.id, {
        name: trimmed,
        code: editCode.trim() || null,
        is_active: editActive,
      })
      setCareers((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name, 'es')),
      )
      setEditTarget(null)
      notify.success('Carrera actualizada correctamente.')
    } catch (err: any) {
      setEditError(err?.message ?? 'No se pudo actualizar la carrera.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await careerApi.remove(deleteTarget.id)
      setCareers((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
      notify.success('Carrera eliminada correctamente.')
    } catch (err) {
      notify.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const columns: ColumnDef<Career>[] = [
    {
      key: 'code',
      header: 'Código',
      sortable: true,
      // Las carreras creadas a mano no tienen código oficial.
      render: (value) => (value ? String(value) : <span className="text-slate-300">—</span>),
    },
    { key: 'name', header: 'Carrera', sortable: true },
    {
      key: 'is_active',
      header: 'Estado',
      render: (value) => (
        <Badge variant={value ? 'success' : 'neutral'}>{value ? 'Activa' : 'Inactiva'}</Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Creada',
      render: (value) => formatDate(String(value)),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Catálogo de Carreras"
        subtitle="Carreras del padrón oficial. El código es el de Control de Estudios y es lo que empareja al estudiante con su carrera."
      />

      {canManage && (
        <Card variant="outlined" padding="md">
          <Card.Header title="Nueva carrera" />
          <Card.Body>
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-end"
              onSubmit={(e) => {
                e.preventDefault()
                void handleCreate()
              }}
            >
              <Input
                label="Código"
                placeholder="Ej: 18000"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="sm:w-[160px]"
              />
              <Input
                label="Nombre"
                placeholder="Ej: Ingeniería Civil"
                value={newName}
                error={createError}
                onChange={(e) => {
                  setNewName(e.target.value)
                  if (createError) setCreateError('')
                }}
                fullWidth
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={creating}
                disabled={creating}
                className="h-11 sm:w-[140px]"
              >
                Crear
              </Button>
            </form>
          </Card.Body>
        </Card>
      )}

      <Table
        columns={columns}
        rows={careers}
        keyField="id"
        loading={loading}
        emptyMessage="No hay carreras registradas."
        actions={
          canManage
            ? (career) => (
                <>
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(career)}>
                    Editar
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteTarget(career)}>
                    Eliminar
                  </Button>
                </>
              )
            : undefined
        }
      />

      <Modal
        open={!!editTarget}
        onClose={() => {
          if (!saving) setEditTarget(null)
        }}
        title="Editar carrera"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={saving} onClick={handleSaveEdit}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Input
            label="Nombre"
            value={editName}
            error={editError}
            onChange={(e) => {
              setEditName(e.target.value)
              if (editError) setEditError('')
            }}
            fullWidth
          />
          <Input
            label="Código (Control de Estudios)"
            placeholder="Ej: 18000"
            value={editCode}
            onChange={(e) => setEditCode(e.target.value)}
            fullWidth
          />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={editActive}
              onChange={(e) => setEditActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Carrera activa
          </label>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        title="Eliminar carrera"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={confirmDelete}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar la carrera{' '}
          <span className="font-semibold text-slate-900">{deleteTarget?.name}</span>? Los registros
          históricos con esta carrera no se modifican; solo dejarán de aparecer en el catálogo.
        </p>
      </Modal>
    </div>
  )
}
