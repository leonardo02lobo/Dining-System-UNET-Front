import { useEffect, useMemo, useRef, useState } from 'react'
import { LunchDetailsForm } from '../components/lunch/LunchDetailsForm'
import { LunchFooterActions } from '../components/lunch/LunchFooterActions'
import { LunchIngredientsTable } from '../components/lunch/LunchIngredientsTable'
import { LunchRecalculationPanel } from '../components/lunch/LunchRecalculationPanel'
import { PreloadedLunchBar } from '../components/lunch/PreloadedLunchBar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import {
  MOCK_INITIAL_INGREDIENTS,
  MOCK_PANTRY,
  MOCK_PRELOADED_LUNCHES,
  buildIngredientFromTemplate,
  getRecalculationPreview,
  recalculateIngredients,
} from '../data/mockLunch'
import type { LunchFormIngredient } from '../types/lunch'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

export function CreateLunchPage() {
  const [lunchName, setLunchName] = useState('Arroz con pollo')
  const [date, setDate] = useState(todayIso())
  const [plateCount, setPlateCount] = useState(500)
  const [previousPlates, setPreviousPlates] = useState(500)
  const [ingredients, setIngredients] = useState<LunchFormIngredient[]>(MOCK_INITIAL_INGREDIENTS)
  const [preloadedId, setPreloadedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LunchFormIngredient | null>(null)
  const [saving, setSaving] = useState(false)

  const [selectedPantryId, setSelectedPantryId] = useState('')
  const [editQty, setEditQty] = useState('')

  const plateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pantryOptions = MOCK_PANTRY.map((p) => ({
    value: String(p.id),
    label: `${p.name} (${p.available} ${p.unit} disponibles)`,
  }))

  const previews = useMemo(
    () => getRecalculationPreview(ingredients, previousPlates, plateCount),
    [ingredients, previousPlates, plateCount]
  )

  useEffect(() => {
    if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current)
    plateDebounceRef.current = setTimeout(() => {
      setIngredients((prev) => recalculateIngredients(prev, plateCount))
      setPreviousPlates(plateCount)
    }, 400)
    return () => {
      if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current)
    }
  }, [plateCount])

  function handleLoadPreloaded() {
    const template = MOCK_PRELOADED_LUNCHES.find((l) => l.id === preloadedId)
    if (!template) return

    setLunchName(template.name.replace(' (plantilla)', ''))
    setPlateCount(template.plate_count)
    setPreviousPlates(template.plate_count)

    const loaded = template.ingredients.map((item) => {
      const pantry = MOCK_PANTRY.find((p) => p.id === item.ingredient_id)
      return buildIngredientFromTemplate(
        item,
        template.plate_count,
        pantry?.available ?? 0
      )
    })
    setIngredients(loaded)
  }

  function openAddModal() {
    setEditTarget(null)
    setSelectedPantryId('')
    setEditQty('')
    setModalOpen(true)
  }

  function openEditModal(item: LunchFormIngredient) {
    setEditTarget(item)
    setSelectedPantryId(String(item.ingredient_id))
    setEditQty(String(item.calculated_quantity))
    setModalOpen(true)
  }

  function handleSaveIngredient() {
    const pantry = MOCK_PANTRY.find((p) => p.id === Number(selectedPantryId))
    if (!pantry || !editQty) return

    const qty = Number(editQty)
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
      const exists = ingredients.some((i) => i.ingredient_id === pantry.id)
      if (exists) return

      setIngredients((prev) => [
        ...prev,
        {
          ingredient_id: pantry.id,
          ingredient_name: pantry.name,
          category: pantry.category,
          unit: pantry.unit,
          calculated_quantity: qty,
          available_quantity: pantry.available,
          quantity_per_plate: quantityPerPlate,
        },
      ])
    }
    setModalOpen(false)
  }

  function handleDelete(item: LunchFormIngredient) {
    if (!confirm(`¿Quitar "${item.ingredient_name}" del almuerzo?`)) return
    setIngredients((prev) => prev.filter((i) => i.ingredient_id !== item.ingredient_id))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      alert('Almuerzo guardado (simulación, sin backend).')
      setPreviousPlates(plateCount)
    } finally {
      setSaving(false)
    }
  }

  function handleDownload() {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-black sm:text-4xl">Crear Almuerzo</h1>

      <PreloadedLunchBar
        options={MOCK_PRELOADED_LUNCHES}
        selectedId={preloadedId}
        onSelect={setPreloadedId}
        onLoad={handleLoadPreloaded}
      />

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

          <LunchFooterActions
            onSave={handleSave}
            onDownload={handleDownload}
            saving={saving}
          />
        </div>

        <LunchRecalculationPanel
          previousPlates={previousPlates}
          currentPlates={plateCount}
          previews={previews}
          onAddIngredient={openAddModal}
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
              disabled={!selectedPantryId || !editQty || (!editTarget && ingredients.some((i) => i.ingredient_id === Number(selectedPantryId)))}
            >
              {editTarget ? 'Actualizar' : 'Agregar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Ingrediente"
            options={pantryOptions}
            value={selectedPantryId}
            onChange={(e) => setSelectedPantryId(e.target.value)}
            placeholder="Selecciona un ingrediente..."
            fullWidth
            disabled={!!editTarget}
          />
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
    </div>
  )
}
