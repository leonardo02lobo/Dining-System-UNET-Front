import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { lunchApi } from '../api/lunch'
import { errorMessage } from '../utils/apiErrors'
import { notify } from '../utils/toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type ColumnDef } from '../components/ui/Table'
import type { LunchTemplateResponse } from '../types/lunch'

function formatTemplateDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value || '—'
  return parsed.toLocaleDateString('es-VE')
}

export function LunchTemplatesPage() {
  const [templates, setTemplates] = useState<LunchTemplateResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [editTarget, setEditTarget] = useState<LunchTemplateResponse | null>(null)
  const [editName, setEditName] = useState('')
  const [editBasePlates, setEditBasePlates] = useState(1)
  const [editError, setEditError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<LunchTemplateResponse | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadTemplates = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await lunchApi.listLunchTemplates()
      setTemplates(data)
    } catch (err) {
      setLoadError(errorMessage(err, {}, 'No se pudieron cargar las plantillas.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  function openEdit(template: LunchTemplateResponse) {
    setEditTarget(template)
    setEditName(template.name)
    setEditBasePlates(template.basePlatesQuantity)
    setEditError('')
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    const name = editName.trim()
    if (!name) {
      setEditError('Ingresa el nombre de la plantilla.')
      return
    }
    setSaving(true)
    setEditError('')
    try {
      await lunchApi.updateLunchTemplate(editTarget.id, {
        name,
        basePlatesQuantity: Math.max(1, editBasePlates),
      })
      notify.success('Plantilla actualizada.')
      setEditTarget(null)
      await loadTemplates()
    } catch (err) {
      setEditError(errorMessage(err, {}, 'No se pudo actualizar la plantilla.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await lunchApi.deleteLunchTemplate(deleteTarget.id)
      notify.success('Plantilla eliminada.')
      setDeleteTarget(null)
      await loadTemplates()
    } catch (err) {
      setDeleteError(
        errorMessage(
          err,
          { 409: 'No se puede eliminar: la plantilla está en uso por almuerzos creados.' },
          'No se pudo eliminar la plantilla.',
        ),
      )
    } finally {
      setDeleting(false)
    }
  }

  const columns: ColumnDef<LunchTemplateResponse>[] = [
    { key: 'name', header: 'Nombre', sortable: true },
    {
      key: 'date',
      header: 'Fecha',
      sortable: true,
      render: (_, t) => formatTemplateDate(t.date),
    },
    { key: 'basePlatesQuantity', header: 'Platos base', sortable: true },
    {
      key: 'ingredients',
      header: 'Ingredientes',
      render: (_, t) => String(t.ingredients?.length ?? 0),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Plantillas de almuerzo"
        subtitle="Gestiona las plantillas creadas: edítalas o elimínalas"
      />

      {loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Cargando plantillas...
        </div>
      ) : (
        <Table<LunchTemplateResponse>
          columns={columns}
          rows={templates}
          keyField="id"
          emptyMessage="No hay plantillas registradas."
          actions={(template) => (
            <>
              <button
                type="button"
                title="Editar"
                className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                onClick={() => openEdit(template)}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                title="Eliminar"
                className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  setDeleteTarget(template)
                  setDeleteError('')
                }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        />
      )}

      {/* Modal de edición */}
      <Modal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        title="Editar plantilla"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setEditTarget(null)}>
              Cancelar
            </Button>
            <Button size="sm" loading={saving} onClick={handleSaveEdit}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {editError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {editError}
            </div>
          )}
          <Input
            label="Nombre"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
          />
          <Input
            label="Platos base"
            type="number"
            min={1}
            value={editBasePlates}
            onChange={(e) => setEditBasePlates(Math.max(1, Number(e.target.value) || 1))}
            fullWidth
          />
        </div>
      </Modal>

      {/* Modal de confirmación de borrado */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar plantilla"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {deleteError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {deleteError}
            </div>
          )}
          <p className="text-sm text-slate-600">
            ¿Seguro que deseas eliminar la plantilla{' '}
            <strong>{deleteTarget?.name}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
      </Modal>
    </div>
  )
}
