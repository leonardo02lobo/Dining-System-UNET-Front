import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { lunchApi } from '../api/lunch'
import { inventoryApi } from '../api/inventory'
import { errorMessage } from '../utils/apiErrors'
import { notify } from '../utils/toast'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { Table, type ColumnDef } from '../components/ui/Table'
import type { InventoryItem } from '../types/inventory'
import type { LunchTemplateResponse } from '../types/lunch'

/** Fila editable de ingrediente dentro del modal de edición de plantilla. */
interface EditIngredientRow {
  inventoryItemId: number
  name: string
  unit: string
  baseQuantity: number
}

function formatTemplateDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value || '—'
  return parsed.toLocaleDateString('es-VE')
}

export function LunchTemplatesPage() {
  const [templates, setTemplates] = useState<LunchTemplateResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])

  const [editTarget, setEditTarget] = useState<LunchTemplateResponse | null>(null)
  const [editName, setEditName] = useState('')
  const [editBasePlates, setEditBasePlates] = useState(1)
  const [editIngredients, setEditIngredients] = useState<EditIngredientRow[]>([])
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

  useEffect(() => {
    void (async () => {
      try {
        setInventoryItems(await inventoryApi.listItems())
      } catch {
        // Silencioso: sin inventario sólo se limita agregar nuevos ingredientes.
      }
    })()
  }, [])

  const availableItems = useMemo(
    () => inventoryItems.filter((item) => !editIngredients.some((row) => row.inventoryItemId === item.id)),
    [inventoryItems, editIngredients],
  )

  function openEdit(template: LunchTemplateResponse) {
    setEditTarget(template)
    setEditName(template.name)
    setEditBasePlates(template.basePlatesQuantity)
    setEditIngredients(
      (template.ingredients ?? []).map((ingredient) => ({
        inventoryItemId: ingredient.inventoryItemId,
        name: ingredient.inventoryItem?.name ?? `Insumo ${ingredient.inventoryItemId}`,
        unit: ingredient.unit,
        baseQuantity: ingredient.baseQuantity,
      })),
    )
    setEditError('')
  }

  function handleAddIngredient(itemId: string) {
    const id = Number(itemId)
    if (!id || editIngredients.some((row) => row.inventoryItemId === id)) return
    const item = inventoryItems.find((candidate) => candidate.id === id)
    if (!item) return
    setEditIngredients((rows) => [
      ...rows,
      { inventoryItemId: item.id, name: item.name, unit: item.unit, baseQuantity: 1 },
    ])
  }

  function handleIngredientQuantityChange(itemId: number, value: number) {
    setEditIngredients((rows) =>
      rows.map((row) => (row.inventoryItemId === itemId ? { ...row, baseQuantity: value } : row)),
    )
  }

  function handleRemoveIngredient(itemId: number) {
    setEditIngredients((rows) => rows.filter((row) => row.inventoryItemId !== itemId))
  }

  async function handleSaveEdit() {
    if (!editTarget) return
    const name = editName.trim()
    if (!name) {
      setEditError('Ingresa el nombre de la plantilla.')
      return
    }
    const invalidIngredient = editIngredients.find((row) => !(row.baseQuantity > 0))
    if (invalidIngredient) {
      setEditError(`La cantidad de "${invalidIngredient.name}" debe ser mayor a 0.`)
      return
    }
    setSaving(true)
    setEditError('')
    try {
      await lunchApi.updateLunchTemplate(editTarget.id, {
        name,
        basePlatesQuantity: Math.max(1, editBasePlates),
        ingredients: editIngredients.map((row) => ({
          inventoryItemId: row.inventoryItemId,
          baseQuantity: row.baseQuantity,
          unit: row.unit,
        })),
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
          { 409: 'No se puede eliminar: la plantilla está en uso por servicios de alimentación creados.' },
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
        title="Plantillas de servicio de alimentación"
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
        size="lg"
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

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-slate-900">Ingredientes</span>
              <span className="text-xs text-slate-500">
                Cantidades para la base de {Math.max(1, editBasePlates)} plato(s)
              </span>
            </div>

            {editIngredients.length === 0 ? (
              <p className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
                Esta plantilla no tiene ingredientes. Agrega al menos uno abajo.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {editIngredients.map((row) => (
                  <div key={row.inventoryItemId} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700" title={row.name}>
                      {row.name}
                    </span>
                    <div className="w-28 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={row.baseQuantity}
                        onChange={(e) =>
                          handleIngredientQuantityChange(row.inventoryItemId, Number(e.target.value))
                        }
                        fullWidth
                      />
                    </div>
                    <span className="w-14 shrink-0 truncate text-sm text-slate-500">{row.unit}</span>
                    <button
                      type="button"
                      title="Quitar ingrediente"
                      className="shrink-0 rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleRemoveIngredient(row.inventoryItemId)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {availableItems.length > 0 && (
              <Select
                placeholder="Agregar ingrediente..."
                value=""
                options={availableItems.map((item) => ({
                  value: String(item.id),
                  label: `${item.name} (${item.unit})`,
                }))}
                onChange={(e) => handleAddIngredient(e.target.value)}
                fullWidth
              />
            )}
          </div>
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
