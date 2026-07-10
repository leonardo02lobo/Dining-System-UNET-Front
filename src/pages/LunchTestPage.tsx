import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Download, Trash2 } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LunchDetailsForm } from '../components/lunch/LunchDetailsForm'
import { LunchIngredientsTable } from '../components/lunch/LunchIngredientsTable'
import { LunchRecalculationPanel } from '../components/lunch/LunchRecalculationPanel'
import { PreloadedLunchBar } from '../components/lunch/PreloadedLunchBar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { inventoryApi } from '../api/inventory'
import { lunchApi } from '../api/lunch'
import {
  buildIngredientFromTemplate,
  getRecalculationPreview,
  recalculateIngredients,
} from '../utils/lunchRecalculation'
import { notify } from '../utils/toast'
import type { InventoryItem } from '../types/inventory'
import type { LunchFormIngredient, LunchTemplateResponse, PreloadedLunch } from '../types/lunch'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

interface PantryItem {
  id: number
  name: string
  category: string
  unit: string
  available: number
}

function mapInventoryItemToPantry(item: InventoryItem): PantryItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category?.name ?? 'Sin categoría',
    unit: item.unit,
    available: item.currentStock,
  }
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function getRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function mapTemplateToPreloaded(template: LunchTemplateResponse): PreloadedLunch {
  return {
    id: template.id,
    name: template.name,
    plate_count: template.platesQuantity,
    ingredients: template.ingredients.flatMap((item, index) => {
      const record = getRecord(item)
      if (!record) return []

      const inventoryItem = getRecord(record.inventoryItem)
      const name = typeof inventoryItem?.name === 'string'
        ? inventoryItem.name
        : `Ingrediente ${index + 1}`
      const categoryRecord = getRecord(inventoryItem?.category)
      const category = typeof categoryRecord?.name === 'string' ? categoryRecord.name : 'Sin categoría'
      const unit = typeof record.unit === 'string' ? record.unit : ''
      const inventoryItemId = toNumber(record.inventoryItemId) ?? toNumber(inventoryItem?.id)
      const calculatedQuantity = toNumber(record.calculatedQuantity)
      const baseQuantity = toNumber(record.baseQuantity)
      const quantity = calculatedQuantity ?? baseQuantity ?? 0

      if (inventoryItemId === null) return []

      return [{
        ingredient_id: inventoryItemId,
        ingredient_name: name,
        category,
        unit,
        quantity_per_plate: template.platesQuantity > 0 ? quantity / template.platesQuantity : 0,
      }]
    }),
  }
}

export function LunchTestPage() {
  const [lunchName, setLunchName] = useState('Arroz con pollo')
  const [date, setDate] = useState(todayIso())
  const [plateCount, setPlateCount] = useState(500)
  const [desiredPlateCount, setDesiredPlateCount] = useState(500)
  const [ingredients, setIngredients] = useState<LunchFormIngredient[]>([])
  const [preloadedId, setPreloadedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LunchFormIngredient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LunchFormIngredient | null>(null)
  const [error, setError] = useState('')
  const [pantry, setPantry] = useState<PantryItem[]>([])
  const [pantryLoading, setPantryLoading] = useState(false)
  const [pantryError, setPantryError] = useState('')
  const [preloadedTemplates, setPreloadedTemplates] = useState<PreloadedLunch[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState('')
  const [selectedPantryId, setSelectedPantryId] = useState('')
  const [editQty, setEditQty] = useState('')
  const [ingredientDropdownOpen, setIngredientDropdownOpen] = useState(false)

  const plateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pantryOptions = pantry.map((item) => ({
    value: String(item.id),
    label: `${item.name} (${item.available} ${item.unit} disponibles)`,
  }))

  const selectedPantryItem = useMemo(
    () => pantry.find((item) => item.id === Number(selectedPantryId)) ?? null,
    [pantry, selectedPantryId],
  )

  const editQtyNumber = Number(editQty)
  const hasValidEditQty = editQty.trim() !== '' && Number.isFinite(editQtyNumber) && editQtyNumber > 0
  const selectedIngredientAlreadyAdded = !editTarget && ingredients.some((i) => i.ingredient_id === Number(selectedPantryId))

  const previews = useMemo(
    () => getRecalculationPreview(ingredients, plateCount, desiredPlateCount),
    [ingredients, plateCount, desiredPlateCount],
  )

  const loadPantry = useCallback(async () => {
    setPantryLoading(true)
    setPantryError('')

    try {
      const data = await inventoryApi.listItems()
      setPantry(data.map(mapInventoryItemToPantry))
    } catch {
      setPantryError('No se pudieron cargar los ingredientes del inventario.')
    } finally {
      setPantryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current)
    plateDebounceRef.current = setTimeout(() => {
      setIngredients((prev) => recalculateIngredients(prev, plateCount))
    }, 400)
    return () => {
      if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current)
    }
  }, [plateCount])

  useEffect(() => {
    let mounted = true

    async function loadInitialData() {
      setPantryLoading(true)
      setTemplatesLoading(true)
      setPantryError('')
      setTemplatesError('')

      try {
        const data = await inventoryApi.listItems()
        if (!mounted) return
        setPantry(data.map(mapInventoryItemToPantry))
      } catch {
        if (!mounted) return
        setPantryError('No se pudieron cargar los ingredientes del inventario.')
      } finally {
        if (mounted) setPantryLoading(false)
      }

      try {
        const templates = await lunchApi.listLunchTemplates()
        if (!mounted) return
        setPreloadedTemplates(templates.map(mapTemplateToPreloaded))
      } catch {
        if (!mounted) return
        setTemplatesError('No se pudieron cargar las plantillas de almuerzo.')
      } finally {
        if (mounted) setTemplatesLoading(false)
      }
    }

    loadInitialData()

    return () => {
      mounted = false
    }
  }, [])

  function handleLoadPreloaded() {
    const template = preloadedTemplates.find((l) => l.id === preloadedId)
    if (!template) return

    if (template.ingredients.length === 0) {
      setError('La plantilla seleccionada no trae ingredientes en la respuesta.')
      return
    }

    setLunchName(template.name)
    setPlateCount(template.plate_count)
    setDesiredPlateCount(template.plate_count)

    const loaded = template.ingredients.flatMap((item) => {
      const pantryItem = pantry.find((p) => p.id === item.ingredient_id)
      if (!pantryItem) return []

      return buildIngredientFromTemplate(item, template.plate_count, pantryItem.available)
    })
    setIngredients(loaded)
    setError('')
  }

  function openAddModal() {
    setEditTarget(null)
    setSelectedPantryId('')
    setEditQty('')
    setIngredientDropdownOpen(false)
    setModalOpen(true)
    loadPantry()
  }

  function openEditModal(item: LunchFormIngredient) {
    setEditTarget(item)
    setSelectedPantryId(String(item.ingredient_id))
    setEditQty(String(item.calculated_quantity))
    setIngredientDropdownOpen(false)
    setModalOpen(true)
  }

  function handleSaveIngredient() {
    const pantryItem = selectedPantryItem
    if (!pantryItem || !hasValidEditQty) return

    const qty = editQtyNumber
    const quantityPerPlate = qty / plateCount

    if (editTarget) {
      setIngredients((prev) =>
        prev.map((i) =>
          i.ingredient_id === editTarget.ingredient_id
            ? {
                ...i,
                calculated_quantity: qty,
                quantity_per_plate: quantityPerPlate,
              }
            : i
        )
      )
    } else {
      const exists = ingredients.some((i) => i.ingredient_id === pantryItem.id)
      if (exists) return

      setIngredients((prev) => [
        ...prev,
        {
          ingredient_id: pantryItem.id,
          ingredient_name: pantryItem.name,
          category: pantryItem.category,
          unit: pantryItem.unit,
          calculated_quantity: qty,
          available_quantity: pantryItem.available,
          quantity_per_plate: quantityPerPlate,
        },
      ])
    }

    setError('')
    setModalOpen(false)
  }

  function handleDelete(item: LunchFormIngredient) {
    setDeleteTarget(item)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    setIngredients((prev) => prev.filter((i) => i.ingredient_id !== deleteTarget.ingredient_id))
    setDeleteTarget(null)
  }

  function handleApplyRecalculation() {
    if (ingredients.length === 0) return

    setIngredients((prev) => recalculateIngredients(prev, desiredPlateCount))
    setPlateCount(desiredPlateCount)
    setError('')
  }

  function handleDownload() {
    if (ingredients.length === 0) {
      notify.info('Agrega ingredientes antes de descargar la lista.')
      return
    }

    const doc = new jsPDF()
    doc.text('Prueba de almuerzo', 14, 15)
    doc.setFontSize(11)
    doc.text(`Almuerzo: ${lunchName.trim() || 'Sin nombre'}`, 14, 23)
    doc.text(`Fecha: ${date || 'Sin fecha'}`, 14, 30)
    doc.text(`Platos base: ${plateCount} | Platos deseados: ${desiredPlateCount}`, 14, 37)

    autoTable(doc, {
      startY: 45,
      head: [['Ingrediente', 'Categoria', 'Cantidad calculada', 'Stock disponible']],
      body: ingredients.map((item) => [
        item.ingredient_name,
        item.category,
        `${item.calculated_quantity} ${item.unit}`,
        `${item.available_quantity} ${item.unit}`,
      ]),
    })

    doc.save('prueba-almuerzo.pdf')
  }

  function handleClearLunch() {
    setIngredients([])
    setError('')
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-black sm:text-3xl">Pruebas de Almuerzo</h1>

      <PreloadedLunchBar
        options={preloadedTemplates}
        selectedId={preloadedId}
        onSelect={setPreloadedId}
        onLoad={handleLoadPreloaded}
      />

      {(templatesLoading || templatesError) && (
        <div className={`rounded-md border px-3 py-2 text-sm ${
          templatesError
            ? 'border-amber-200 bg-amber-50 text-amber-800'
            : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          {templatesError || 'Cargando plantillas...'}
        </div>
      )}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-6">
          <LunchDetailsForm
            lunchName={lunchName}
            date={date}
            plateCount={plateCount}
            onLunchNameChange={setLunchName}
            onDateChange={setDate}
            onPlateCountChange={setPlateCount}
          />

          <LunchIngredientsTable
            items={ingredients}
            plateCount={plateCount}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row sm:flex-wrap sm:gap-8">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-[45px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-6 text-[15px] font-bold text-white transition hover:bg-[#021a52]"
            >
              <Download size={22} />
              Descargar lista
            </button>
            <button
              type="button"
              onClick={handleClearLunch}
              disabled={ingredients.length === 0}
              className="inline-flex h-[45px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-[10px] bg-red-600 px-6 text-[15px] font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 size={22} />
              Limpiar almuerzo
            </button>
          </div>
        </div>

        <LunchRecalculationPanel
          basePlates={plateCount}
          desiredPlates={desiredPlateCount}
          previews={previews}
          onAddIngredient={openAddModal}
          onDesiredPlatesChange={setDesiredPlateCount}
          onApplyRecalculation={handleApplyRecalculation}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar ingrediente' : 'Agregar ingrediente'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveIngredient}
              disabled={!selectedPantryId || !hasValidEditQty || selectedIngredientAlreadyAdded}
            >
              {editTarget ? 'Actualizar' : 'Agregar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Ingrediente
            </label>
            <button
              type="button"
              disabled={!!editTarget || (pantryLoading && pantry.length === 0)}
              onClick={() => setIngredientDropdownOpen((open) => !open)}
              className="flex h-11 w-full items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 text-left text-sm text-slate-800 shadow-sm outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60"
            >
              <span className="min-w-0 truncate">
                {selectedPantryItem
                  ? `${selectedPantryItem.name} (${selectedPantryItem.available} ${selectedPantryItem.unit} disponibles)`
                  : pantryLoading
                    ? 'Cargando inventario...'
                    : 'Selecciona un ingrediente...'}
              </span>
              <ChevronDown size={16} className="flex-shrink-0 text-slate-400" />
            </button>

            {ingredientDropdownOpen && !editTarget && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-[55] cursor-default"
                  aria-label="Cerrar lista de ingredientes"
                  onClick={() => setIngredientDropdownOpen(false)}
                />
                <ul className="absolute left-0 right-0 z-[60] mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  {pantryOptions.length === 0 ? (
                    <li className="px-3 py-2 text-slate-500">
                      {pantryLoading ? 'Cargando inventario...' : 'No hay ingredientes disponibles.'}
                    </li>
                  ) : (
                    pantryOptions.map((option) => (
                      <li key={option.value}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-slate-800 transition hover:bg-blue-50"
                          onClick={() => {
                            setSelectedPantryId(option.value)
                            setIngredientDropdownOpen(false)
                          }}
                        >
                          {option.label}
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </>
            )}
          </div>
          {pantryError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {pantryError}
            </div>
          )}
          {!pantryLoading && !pantryError && pantry.length === 0 && (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
              No hay ingredientes registrados en inventario.
            </div>
          )}
          {selectedIngredientAlreadyAdded && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              El ingrediente seleccionado ya fue agregado al almuerzo.
            </div>
          )}
          <Input
            label={`Cantidad calculada (${plateCount} platos)`}
            type="number"
            min="0"
            step="0.01"
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            fullWidth
          />
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Quitar ingrediente"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>
              Quitar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas quitar{' '}
          <span className="font-semibold text-slate-900">{deleteTarget?.ingredient_name}</span>{' '}
          del almuerzo?
        </p>
      </Modal>
    </div>
  )
}
