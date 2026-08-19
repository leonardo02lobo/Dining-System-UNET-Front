import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronDown, Plus } from 'lucide-react'
import { LunchDatePlanner, todayIso, type PlannerRange } from '../components/lunch/LunchDatePlanner'
import { LunchDetailsForm } from '../components/lunch/LunchDetailsForm'
import { LunchFooterActions } from '../components/lunch/LunchFooterActions'
import { LunchIngredientsTable } from '../components/lunch/LunchIngredientsTable'
import { LunchRecalculationTable } from '../components/lunch/LunchRecalculationTable'
import { MissingStockModal } from '../components/lunch/MissingStockModal'
import { PreloadedLunchBar } from '../components/lunch/PreloadedLunchBar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { notify } from '../utils/toast'
import { errorMessage } from '../utils/apiErrors'
import { inventoryApi } from '../api/inventory'
import { lunchApi } from '../api/lunch'
import {
  buildIngredientFromTemplate,
  formatQuantity,
  formatStock,
  getRecalculationPreview,
  isValidPlateCount,
  payloadQuantity,
  recalculateIngredients,
  scaleIngredient,
} from '../utils/lunchRecalculation'
import type { InventoryItem } from '../types/inventory'
import {
  MEAL_TYPE_LABEL,
  type LunchFormIngredient,
  type LunchMissingStockItem,
  type LunchResponse,
  type LunchTemplateResponse,
  type MealType,
  type PreloadedLunch,
} from '../types/lunch'
import { generateLunchListPdf } from '../utils/pdfLunch'

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
  // `baseQuantity` de la plantilla está expresada para `basePlatesQuantity`
  // platos (así la guarda el backend al confirmar), no para `platesQuantity`:
  // usar el denominador equivocado deformaba la receta al precargarla.
  const basePlates = isValidPlateCount(template.basePlatesQuantity)
    ? template.basePlatesQuantity
    : template.platesQuantity

  return {
    id: template.id,
    name: template.name,
    meal_type: template.mealType ?? 'ALMUERZO',
    plate_count: basePlates,
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
      const baseQuantity = toNumber(record.baseQuantity) ?? 0

      if (inventoryItemId === null) return []

      return [{
        ingredient_id: inventoryItemId,
        ingredient_name: name,
        category,
        unit,
        base_quantity: baseQuantity,
      }]
    }),
  }
}

/** Ingredientes de un almuerzo del servidor, en la forma que usa el formulario. */
function mapLunchToFormIngredients(
  lunch: LunchResponse,
  pantry: PantryItem[],
): LunchFormIngredient[] {
  return lunch.ingredients.flatMap((ingredient) => {
    const inventoryItem = getRecord(ingredient.inventoryItem)
    const name = typeof inventoryItem?.name === 'string' ? inventoryItem.name : null
    if (!name) return []
    const categoryRecord = getRecord(inventoryItem?.category)
    const pantryItem = pantry.find((item) => item.id === ingredient.inventoryItemId)

    return [{
      ingredient_id: ingredient.inventoryItemId,
      ingredient_name: name,
      category: typeof categoryRecord?.name === 'string' ? categoryRecord.name : 'Sin categoría',
      unit: ingredient.unit,
      base_quantity: ingredient.baseQuantity,
      base_plates: lunch.basePlatesQuantity,
      calculated_quantity: ingredient.calculatedQuantity,
      available_quantity: pantryItem?.available ?? 0,
    }]
  })
}

const DEFAULT_NAME = 'Arroz con pollo'
const DEFAULT_PLATES = 500

export function CreateLunchPage() {
  const navigate = useNavigate()

  // --- Paso 1: la fecha manda -----------------------------------------------
  const [date, setDate] = useState(todayIso())
  const [range, setRange] = useState<PlannerRange>('day')
  const [plannedLunches, setPlannedLunches] = useState<LunchResponse[]>([])
  const [plannedLoading, setPlannedLoading] = useState(false)
  const [plannedError, setPlannedError] = useState('')

  // --- Formulario del servicio ----------------------------------------------
  const [editingLunchId, setEditingLunchId] = useState<number | null>(null)
  const [editingStatus, setEditingStatus] = useState<'DRAFT' | null>(null)
  const [lunchName, setLunchName] = useState(DEFAULT_NAME)
  const [mealType, setMealType] = useState<MealType>('ALMUERZO')
  const [plateCount, setPlateCount] = useState(DEFAULT_PLATES)
  const [desiredPlateCount, setDesiredPlateCount] = useState(DEFAULT_PLATES)
  const [ingredients, setIngredients] = useState<LunchFormIngredient[]>([])
  const [preloadedId, setPreloadedId] = useState<number | null>(null)
  const [preloadedTemplates, setPreloadedTemplates] = useState<PreloadedLunch[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState('')

  // --- Inventario (contexto, nunca veto: ver FE-03) --------------------------
  const [pantry, setPantry] = useState<PantryItem[]>([])
  const [pantryLoading, setPantryLoading] = useState(false)
  const [pantryError, setPantryError] = useState('')

  // --- Modales y estado de las acciones -------------------------------------
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LunchFormIngredient | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<LunchFormIngredient | null>(null)
  const [deleteDraftTarget, setDeleteDraftTarget] = useState<LunchResponse | null>(null)
  const [deletingDraft, setDeletingDraft] = useState(false)
  const [confirmPreviewOpen, setConfirmPreviewOpen] = useState(false)
  const [missingItems, setMissingItems] = useState<LunchMissingStockItem[] | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saveError, setSaveError] = useState('')

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
  const selectedIngredientAlreadyAdded =
    !editTarget && ingredients.some((item) => item.ingredient_id === Number(selectedPantryId))
  // FE-03 — pedir más de lo que hay es legítimo en un borrador: se avisa, no se
  // bloquea. Quien planifica el viernes todavía no ha ido al mercado.
  const exceedsSelectedStock =
    !!selectedPantryItem && hasValidEditQty && editQtyNumber > selectedPantryItem.available
  const selectedStockWarning = exceedsSelectedStock && selectedPantryItem
    ? `Hoy solo hay ${formatStock(selectedPantryItem.available, selectedPantryItem.unit)} de ${selectedPantryItem.name}. Puedes guardarlo igual: la confirmación es la que exige existencias.`
    : ''

  const plateCountError = !isValidPlateCount(plateCount)
    ? 'La cantidad base de platos debe ser mayor que cero para poder recalcular.'
    : !isValidPlateCount(desiredPlateCount)
      ? 'La cantidad deseada de platos debe ser mayor que cero.'
      : ''

  const previews = useMemo(
    () => getRecalculationPreview(ingredients, plateCount, desiredPlateCount),
    [ingredients, plateCount, desiredPlateCount],
  )

  /** Insumos cuya cantidad para los platos deseados supera la existencia actual. */
  const insufficientIngredients = useMemo(
    () =>
      ingredients.filter(
        (item) =>
          payloadQuantity(scaleIngredient(item, desiredPlateCount), item.unit) >
          item.available_quantity,
      ),
    [ingredients, desiredPlateCount],
  )

  const lunchIngredientPayloads = useMemo(
    () =>
      ingredients.map((item) => ({
        inventoryItemId: item.ingredient_id,
        // Cantidad original reexpresada a los platos base del formulario; el
        // backend vuelve a aplicar la regla de tres sobre ella hasta los platos
        // deseados, así que nunca le mandamos un valor ya recalculado.
        baseQuantity: payloadQuantity(scaleIngredient(item, plateCount), item.unit),
        calculatedQuantity: payloadQuantity(scaleIngredient(item, desiredPlateCount), item.unit),
        unit: item.unit,
      })),
    [ingredients, plateCount, desiredPlateCount],
  )

  const formIsComplete =
    lunchName.trim().length > 0 && ingredients.length > 0 && !plateCountError && !!date
  const isPastDate = date < todayIso()

  const loadPantry = useCallback(async () => {
    setPantryLoading(true)
    setPantryError('')
    try {
      const data = await inventoryApi.listItems()
      setPantry(data.map(mapInventoryItemToPantry))
      return data.map(mapInventoryItemToPantry)
    } catch {
      setPantryError('No se pudieron cargar los ingredientes del inventario.')
      return []
    } finally {
      setPantryLoading(false)
    }
  }, [])

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError('')
    try {
      const templates = await lunchApi.listLunchTemplates()
      setPreloadedTemplates(templates.map(mapTemplateToPreloaded))
    } catch {
      setTemplatesError('No se pudieron cargar las plantillas de servicio de alimentación.')
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  /**
   * Planificación visible. En vista diaria se pide la fecha exacta al servidor;
   * en semana/mes se trae la lista y se recorta aquí, para no disparar una
   * petición por día del calendario.
   */
  const loadPlanned = useCallback(async () => {
    setPlannedLoading(true)
    setPlannedError('')
    try {
      const data = range === 'day'
        ? await lunchApi.listLunches({ date })
        : await lunchApi.listLunches()
      setPlannedLunches(data)
    } catch {
      setPlannedError('No se pudo cargar la planificación de esta fecha.')
    } finally {
      setPlannedLoading(false)
    }
  }, [date, range])

  useEffect(() => {
    void loadPlanned()
  }, [loadPlanned])

  useEffect(() => {
    void loadPantry()
    void loadTemplates()
  }, [loadPantry, loadTemplates])

  // Cada cambio de platos recalcula TODOS los ingredientes desde su cantidad
  // original (`base_quantity`/`base_plates`), no desde el último resultado.
  useEffect(() => {
    if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current)
    plateDebounceRef.current = setTimeout(() => {
      setIngredients((prev) => recalculateIngredients(prev, plateCount))
    }, 400)
    return () => {
      if (plateDebounceRef.current) clearTimeout(plateDebounceRef.current)
    }
  }, [plateCount])

  // --- Formulario -----------------------------------------------------------

  function resetForm(nextDate = date) {
    setEditingLunchId(null)
    setEditingStatus(null)
    setLunchName(DEFAULT_NAME)
    setMealType('ALMUERZO')
    setPlateCount(DEFAULT_PLATES)
    setDesiredPlateCount(DEFAULT_PLATES)
    setIngredients([])
    setPreloadedId(null)
    setSaveError('')
    setDate(nextDate)
  }

  function handleOpenDraft(lunch: LunchResponse) {
    setEditingLunchId(lunch.id)
    setEditingStatus('DRAFT')
    setLunchName(lunch.name)
    setMealType(lunch.mealType)
    setDate(lunch.date)
    setPlateCount(lunch.basePlatesQuantity)
    setDesiredPlateCount(lunch.platesQuantity)
    setIngredients(mapLunchToFormIngredients(lunch, pantry))
    setSaveError('')
  }

  function handleLoadPreloaded() {
    const template = preloadedTemplates.find((item) => item.id === preloadedId)
    if (!template) return

    if (template.ingredients.length === 0) {
      setSaveError('La plantilla seleccionada no trae ingredientes en la respuesta.')
      return
    }

    setLunchName(template.name)
    setMealType(template.meal_type)
    setPlateCount(template.plate_count)
    setDesiredPlateCount(template.plate_count)

    const loaded = template.ingredients.flatMap((item) => {
      const pantryItem = pantry.find((entry) => entry.id === item.ingredient_id)
      if (!pantryItem) return []
      return buildIngredientFromTemplate(item, template.plate_count, pantryItem.available)
    })
    setIngredients(loaded)
    setSaveError('')
  }

  function openAddModal() {
    setEditTarget(null)
    setSelectedPantryId('')
    setEditQty('')
    setIngredientDropdownOpen(false)
    setModalOpen(true)
    void loadPantry()
  }

  function openEditModal(item: LunchFormIngredient) {
    setEditTarget(item)
    setSelectedPantryId(String(item.ingredient_id))
    setEditQty(String(item.base_quantity))
    setIngredientDropdownOpen(false)
    setModalOpen(true)
  }

  function handleSaveIngredient() {
    const pantryItem = selectedPantryItem
    if (!pantryItem || !hasValidEditQty) return
    if (!isValidPlateCount(plateCount)) {
      setSaveError('Define una cantidad de platos mayor que cero antes de agregar ingredientes.')
      return
    }

    // La cantidad tecleada es la ORIGINAL para los platos base actuales: queda
    // fijada junto con esos platos y de ahí se deriva todo recálculo posterior.
    const qty = editQtyNumber

    if (editTarget) {
      setIngredients((prev) =>
        prev.map((item) =>
          item.ingredient_id === editTarget.ingredient_id
            ? { ...item, base_quantity: qty, base_plates: plateCount, calculated_quantity: qty }
            : item,
        ),
      )
    } else {
      if (ingredients.some((item) => item.ingredient_id === pantryItem.id)) return
      setIngredients((prev) => [
        ...prev,
        {
          ingredient_id: pantryItem.id,
          ingredient_name: pantryItem.name,
          category: pantryItem.category,
          unit: pantryItem.unit,
          base_quantity: qty,
          base_plates: plateCount,
          calculated_quantity: qty,
          available_quantity: pantryItem.available,
        },
      ])
    }
    setSaveError('')
    setModalOpen(false)
  }

  function confirmDeleteIngredient() {
    if (!deleteTarget) return
    setIngredients((prev) => prev.filter((item) => item.ingredient_id !== deleteTarget.ingredient_id))
    setDeleteTarget(null)
  }

  // --- Guardar borrador (FE-02) --------------------------------------------

  function validateForm(): string {
    if (!lunchName.trim()) return 'Ingresa el nombre del servicio de alimentación.'
    if (!date) return 'Selecciona la fecha del servicio.'
    if (isPastDate) return 'No se puede planificar para una fecha anterior a hoy.'
    if (ingredients.length === 0) return 'Agrega al menos un ingrediente al servicio.'
    return plateCountError
  }

  /** Persiste el borrador (alta o actualización) y devuelve el almuerzo guardado. */
  async function persistDraft(): Promise<LunchResponse | null> {
    const problem = validateForm()
    if (problem) {
      setSaveError(problem)
      return null
    }

    setSaveError('')
    const payload = {
      name: lunchName.trim(),
      date,
      mealType,
      platesQuantity: desiredPlateCount,
      basePlatesQuantity: plateCount,
      ingredients: lunchIngredientPayloads,
    }

    try {
      if (editingLunchId !== null) {
        // Actualizar el mismo borrador —y no crear otro— es lo que evita que un
        // intento fallido de confirmación deje duplicados en la fecha (FE-05).
        // Encabezado y receta viajan juntos: el backend los aplica en la misma
        // transacción, así que no existe un borrador con la mitad del cambio.
        return await lunchApi.updateLunch(editingLunchId, payload)
      }

      const created = await lunchApi.createLunch(payload)
      setEditingLunchId(created.id)
      setEditingStatus('DRAFT')
      return created
    } catch (err) {
      setSaveError(
        errorMessage(
          err,
          {
            404: 'Alguno de los insumos ya no existe en el inventario.',
            409: 'No se pudo guardar el borrador: revisa que no haya insumos repetidos y que las unidades coincidan con el inventario.',
          },
          'No se pudo guardar el borrador. Intenta nuevamente.',
        ),
      )
      return null
    }
  }

  async function handleSaveDraft() {
    setSavingDraft(true)
    try {
      const saved = await persistDraft()
      if (!saved) return
      notify.success('Borrador guardado. El inventario no se ha modificado.')
      await loadPlanned()
    } finally {
      setSavingDraft(false)
    }
  }

  function handleOpenConfirmPreview() {
    const problem = validateForm()
    if (problem) {
      setSaveError(problem)
      return
    }
    setSaveError('')
    setConfirmPreviewOpen(true)
  }

  /**
   * FE-02 — confirmar: primero se guarda el borrador (para que lo confirmado sea
   * exactamente lo que está en pantalla) y después se confirma. Un faltante no
   * es un error de la petición: abre el modal y el servicio sigue en borrador.
   */
  async function handleConfirm() {
    setConfirming(true)
    setConfirmPreviewOpen(false)
    try {
      const draft = await persistDraft()
      if (!draft) return

      const result = await lunchApi.confirmLunch(draft.id)

      if (result.status === 'insufficient_stock') {
        setMissingItems(result.items)
        // El stock que devolvió el backend es el bueno: se refresca la despensa
        // para que la pantalla deje de mostrar el que ya no es.
        await loadPantry()
        return
      }

      notify.success('Servicio confirmado: el inventario quedó descontado.')
      resetForm(draft.date)
      await Promise.all([loadPlanned(), loadPantry(), loadTemplates()])
    } catch (err) {
      setSaveError(
        errorMessage(
          err,
          {
            409: 'Este servicio ya no puede confirmarse (puede que ya esté confirmado o que se haya quedado sin ingredientes).',
          },
          'No se pudo confirmar el servicio. Intenta nuevamente.',
        ),
      )
    } finally {
      setConfirming(false)
    }
  }

  async function handleDeleteDraft() {
    if (!deleteDraftTarget) return
    setDeletingDraft(true)
    try {
      await lunchApi.deleteLunch(deleteDraftTarget.id)
      if (editingLunchId === deleteDraftTarget.id) resetForm()
      notify.success('Borrador eliminado.')
      setDeleteDraftTarget(null)
      await loadPlanned()
    } catch (err) {
      notify.error(
        errorMessage(
          err,
          { 409: 'Un servicio confirmado no puede eliminarse.' },
          'No se pudo eliminar el borrador.',
        ),
      )
    } finally {
      setDeletingDraft(false)
    }
  }

  async function handleDownload() {
    const trimmedName = lunchName.trim()
    if (!trimmedName) {
      setSaveError('Ingresa el nombre del servicio antes de descargar la lista.')
      return
    }
    if (ingredients.length === 0) {
      setSaveError('Agrega al menos un ingrediente antes de descargar la lista.')
      return
    }
    setSaveError('')
    try {
      await generateLunchListPdf({ name: trimmedName, date, plateCount, ingredients })
    } catch {
      setSaveError('No se pudo generar el archivo PDF. Intenta nuevamente.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Planificar servicios de alimentación"
        subtitle="Elige la fecha, arma la receta y guárdala como borrador. Confirmar es lo que descuenta el inventario."
      />

      <LunchDatePlanner
        date={date}
        range={range}
        lunches={plannedLunches}
        loading={plannedLoading}
        error={plannedError}
        editingLunchId={editingLunchId}
        onDateChange={(value) => setDate(value)}
        onRangeChange={setRange}
        onOpenDraft={handleOpenDraft}
        onDeleteDraft={setDeleteDraftTarget}
        onCreateNew={() => resetForm()}
      />

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

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[15px] font-bold text-black">
            {editingLunchId === null ? 'Nuevo servicio' : `Editando servicio #${editingLunchId}`}
          </h2>
          {editingStatus === 'DRAFT' && <Badge variant="warning">Borrador</Badge>}
          {editingLunchId !== null && (
            <Button variant="ghost" size="sm" onClick={() => resetForm()}>
              Empezar uno nuevo
            </Button>
          )}
        </div>

        <LunchDetailsForm
          lunchName={lunchName}
          date={date}
          mealType={mealType}
          plateCount={plateCount}
          desiredPlateCount={desiredPlateCount}
          minDate={todayIso()}
          onLunchNameChange={setLunchName}
          onDateChange={setDate}
          onMealTypeChange={setMealType}
          onPlateCountChange={setPlateCount}
          onDesiredPlateCountChange={setDesiredPlateCount}
        />
      </section>

      {plateCountError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {plateCountError}
        </div>
      )}

      {/* Dos tablas paralelas 50/50: ingredientes vs. recálculo automático (issue #9) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        <div className="min-w-0 space-y-3">
          <h2 className="text-[15px] font-bold text-black">Ingredientes</h2>
          <LunchIngredientsTable
            items={ingredients}
            plateCount={plateCount}
            onEdit={openEditModal}
            onDelete={setDeleteTarget}
          />
        </div>

        <div className="min-w-0">
          <LunchRecalculationTable
            basePlates={plateCount}
            desiredPlates={desiredPlateCount}
            previews={previews}
          />
        </div>
      </div>

      {/* FE-03 — aviso, no bloqueo: el borrador puede guardarse igual. */}
      {insufficientIngredients.length > 0 && (
        <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">
              Hoy no hay existencias suficientes para {insufficientIngredients.length}{' '}
              {insufficientIngredients.length === 1 ? 'insumo' : 'insumos'}.
            </p>
            <p>
              Puedes guardar el borrador de todos modos; la confirmación es la que exige el
              stock:{' '}
              {insufficientIngredients
                .map((item) =>
                  `${item.ingredient_name} (requiere ${formatQuantity(scaleIngredient(item, desiredPlateCount), item.unit)}, hay ${formatStock(item.available_quantity, item.unit)})`,
                )
                .join('; ')}
              .
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button type="button" onClick={openAddModal} leftIcon={<Plus size={20} />}>
          Agregar Ingrediente
        </Button>
      </div>

      {saveError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {saveError}
        </div>
      )}

      <LunchFooterActions
        onSaveDraft={handleSaveDraft}
        onConfirm={handleOpenConfirmPreview}
        onDownload={handleDownload}
        savingDraft={savingDraft}
        confirming={confirming}
        saveDisabled={!formIsComplete}
        confirmDisabled={!formIsComplete}
        downloadDisabled={!formIsComplete || savingDraft || confirming}
      />

      {/* --- Modal: agregar / editar ingrediente ----------------------------- */}
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

          <Input
            id="ingredient-base-quantity"
            label={`Cantidad original para ${plateCount} platos${selectedPantryItem ? ` (${selectedPantryItem.unit})` : ''}`}
            hint="Esta es la cantidad base: el recálculo por regla de tres siempre parte de ella."
            type="number"
            min="0"
            step="0.01"
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            fullWidth
          />

          {selectedStockWarning && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {selectedStockWarning}
            </div>
          )}
        </div>
      </Modal>

      {/* --- Modal: previo a confirmar --------------------------------------- */}
      <Modal
        open={confirmPreviewOpen}
        onClose={() => setConfirmPreviewOpen(false)}
        title="Confirmar servicio de alimentación"
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmPreviewOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" loading={confirming} onClick={handleConfirm}>
              Confirmar y descontar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
            <p>
              Al confirmar se descuentan <span className="font-semibold">de inmediato</span> los
              insumos del inventario y el servicio deja de poder editarse o eliminarse.
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Servicio</dt>
              <dd className="text-slate-900">{lunchName.trim()}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Tipo</dt>
              <dd className="text-slate-900">{MEAL_TYPE_LABEL[mealType]}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Fecha</dt>
              <dd className="text-slate-900">{date}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">Platos</dt>
              <dd className="text-slate-900">{desiredPlateCount}</dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">
              Se descontarán {ingredients.length}{' '}
              {ingredients.length === 1 ? 'insumo' : 'insumos'}
            </h3>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 text-sm">
              {ingredients.map((item) => (
                <li key={item.ingredient_id} className="flex justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate text-slate-800">{item.ingredient_name}</span>
                  <span className="tabular-nums text-slate-600">
                    {formatQuantity(scaleIngredient(item, desiredPlateCount), item.unit)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>

      {/* --- Modal: insumos faltantes (FE-04) -------------------------------- */}
      <MissingStockModal
        open={missingItems !== null}
        items={missingItems ?? []}
        onClose={() => setMissingItems(null)}
        onGoToInventory={() => navigate('/inventario')}
      />

      {/* --- Modal: quitar ingrediente del formulario ------------------------ */}
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
            <Button variant="danger" size="sm" onClick={confirmDeleteIngredient}>
              Quitar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas quitar{' '}
          <span className="font-semibold text-slate-900">{deleteTarget?.ingredient_name}</span>{' '}
          del servicio de alimentación?
        </p>
      </Modal>

      {/* --- Modal: eliminar borrador (FE-05) -------------------------------- */}
      <Modal
        open={!!deleteDraftTarget}
        onClose={() => {
          if (!deletingDraft) setDeleteDraftTarget(null)
        }}
        title="Eliminar borrador"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              disabled={deletingDraft}
              onClick={() => setDeleteDraftTarget(null)}
            >
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={deletingDraft} onClick={handleDeleteDraft}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Se eliminará el borrador{' '}
          <span className="font-semibold text-slate-900">{deleteDraftTarget?.name}</span> del{' '}
          {deleteDraftTarget?.date}. El inventario no se ve afectado, porque un borrador nunca
          llegó a descontarlo.
        </p>
      </Modal>
    </div>
  )
}
