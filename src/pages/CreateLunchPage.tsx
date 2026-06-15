import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { LunchDetailsForm } from '../components/lunch/LunchDetailsForm'
import { LunchFooterActions } from '../components/lunch/LunchFooterActions'
import { LunchIngredientsTable } from '../components/lunch/LunchIngredientsTable'
import { LunchRecalculationPanel } from '../components/lunch/LunchRecalculationPanel'
import { PreloadedLunchBar } from '../components/lunch/PreloadedLunchBar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Table, type ColumnDef } from '../components/ui/Table'
import { inventoryApi } from '../api/inventory'
import { lunchApi } from '../api/lunch'
import {
  buildIngredientFromTemplate,
  getRecalculationPreview,
  recalculateIngredients,
} from '../data/mockLunch'
import type { InventoryItem } from '../types/inventory'
import type {
  LunchFormIngredient,
  LunchResponse,
  LunchStockValidationItem,
  LunchTemplateResponse,
  PreloadedLunch,
} from '../types/lunch'
import { logoUnetDataUri, logoDecanatoDataUri } from '../utils/pdfLogos'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function formatPdfDate(value: string) {
  const parsedDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) return value || 'Sin fecha'
  return parsedDate.toLocaleDateString('es-VE')
}

async function loadPdfImage(src: string, maxWidth: number, maxHeight: number) {
  const image = new Image()
  image.src = src
  await image.decode()

  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/png')
}

interface PantryItem {
  id: number
  name: string
  category: string
  unit: string
  available: number
}

interface LunchIngredientDetail {
  id: number
  name: string
  quantity: number | null
  unit: string
}

const lunchDetailColumns: ColumnDef<LunchIngredientDetail>[] = [
  { key: 'name', header: 'Ingrediente', sortable: true },
  {
    key: 'quantity',
    header: 'Cantidad utilizada',
    sortable: true,
    render: (_, ingredient) => `${ingredient.quantity ?? 'Sin cantidad'} ${ingredient.unit}`,
  },
]

function mapInventoryItemToPantry(item: InventoryItem): PantryItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category?.name ?? 'Sin categoría',
    unit: item.unit,
    available: item.currentStock,
  }
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

function formatDisplayDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha'

  return date.toLocaleDateString('es-VE')
}

function toNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function getRecord(value: unknown) {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null
}

function mapLunchIngredientDetails(lunch: LunchResponse): LunchIngredientDetail[] {
  return lunch.ingredients.flatMap((item, index) => {
    const record = getRecord(item)
    if (!record) return []

    const inventoryItem = getRecord(record.inventoryItem)
    const name = typeof inventoryItem?.name === 'string' ? inventoryItem.name : null
    const quantity = toNumber(record.calculatedQuantity)
    const unit = typeof record.unit === 'string' ? record.unit : ''

    if (!name) return []

    return [{
      id: toNumber(record.id) ?? index,
      name,
      quantity,
      unit,
    }]
  })
}

function formatQuantity(value: number, unit: string) {
  return `${Number(value.toFixed(2))} ${unit}`
}

function buildInsufficientStockMessage(items: LunchStockValidationItem[]) {
  const insufficientItems = items.filter((item) => !item.isSufficient)

  if (insufficientItems.length === 0) {
    return 'No hay suficiente stock para confirmar el almuerzo.'
  }

  const details = insufficientItems
    .map((item) =>
      `${item.name}: requiere ${formatQuantity(item.requiredQuantity, item.unit)}, disponible ${formatQuantity(item.availableStock, item.unit)}, faltan ${formatQuantity(item.missingQuantity, item.unit)}`
    )
    .join('; ')

  return `No hay suficiente stock para confirmar el almuerzo. ${details}.`
}

export function CreateLunchPage() {
  const [lunchName, setLunchName] = useState('Arroz con pollo')
  const [date, setDate] = useState(todayIso())
  const [plateCount, setPlateCount] = useState(500)
  const [desiredPlateCount, setDesiredPlateCount] = useState(500)
  const [ingredients, setIngredients] = useState<LunchFormIngredient[]>([])
  const [preloadedId, setPreloadedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LunchFormIngredient | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [pantry, setPantry] = useState<PantryItem[]>([])
  const [pantryLoading, setPantryLoading] = useState(false)
  const [pantryError, setPantryError] = useState('')
  const [createdLunches, setCreatedLunches] = useState<LunchResponse[]>([])
  const [createdLunchesLoading, setCreatedLunchesLoading] = useState(false)
  const [createdLunchesError, setCreatedLunchesError] = useState('')
  const [createdLunchesOpen, setCreatedLunchesOpen] = useState(false)
  const [lunchDetailOpen, setLunchDetailOpen] = useState(false)
  const [lunchDetail, setLunchDetail] = useState<LunchResponse | null>(null)
  const [lunchDetailLoading, setLunchDetailLoading] = useState(false)
  const [lunchDetailError, setLunchDetailError] = useState('')
  const [preloadedTemplates, setPreloadedTemplates] = useState<PreloadedLunch[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState('')

  const [selectedPantryId, setSelectedPantryId] = useState('')
  const [editQty, setEditQty] = useState('')
  const [ingredientDropdownOpen, setIngredientDropdownOpen] = useState(false)
  const downloadDisabled = !lunchName.trim() || !date || plateCount < 1 || ingredients.length === 0

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
  const exceedsSelectedStock = !!selectedPantryItem && hasValidEditQty && editQtyNumber > selectedPantryItem.available
  const selectedStockError = exceedsSelectedStock
    ? `No hay suficiente stock de ${selectedPantryItem.name}. Disponible: ${formatQuantity(selectedPantryItem.available, selectedPantryItem.unit)}.`
    : ''

  const previews = useMemo(
    () => getRecalculationPreview(ingredients, plateCount, desiredPlateCount),
    [ingredients, plateCount, desiredPlateCount]
  )

  const lunchIngredientPayloads = useMemo(
    () =>
      ingredients.map((item) => ({
        inventoryItemId: item.ingredient_id,
        baseQuantity: item.quantity_per_plate * plateCount,
        calculatedQuantity: item.calculated_quantity,
        unit: item.unit,
      })),
    [ingredients, plateCount],
  )

  const lunchIngredientDetails = useMemo(
    () => lunchDetail ? mapLunchIngredientDetails(lunchDetail) : [],
    [lunchDetail],
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
      setTemplatesLoading(true)
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
      setSaveError('La plantilla seleccionada no trae ingredientes en la respuesta.')
      return
    }

    setLunchName(template.name)
    setPlateCount(template.plate_count)
    setDesiredPlateCount(template.plate_count)

    const loaded = template.ingredients.flatMap((item) => {
      const pantryItem = pantry.find((p) => p.id === item.ingredient_id)
      if (!pantryItem) return []

      return buildIngredientFromTemplate(
        item,
        template.plate_count,
        pantryItem.available
      )
    })
    setIngredients(loaded)
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
    if (!pantryItem || !hasValidEditQty || exceedsSelectedStock) return

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
    setSaveError('')
    setModalOpen(false)
  }

  function handleDelete(item: LunchFormIngredient) {
    if (!confirm(`¿Quitar "${item.ingredient_name}" del almuerzo?`)) return
    setIngredients((prev) => prev.filter((i) => i.ingredient_id !== item.ingredient_id))
  }

  function handleApplyRecalculation() {
    if (ingredients.length === 0) return

    const localInsufficientItems = ingredients.filter((item) => item.quantity_per_plate * desiredPlateCount > item.available_quantity)
    if (localInsufficientItems.length > 0) {
      setSaveError(
        `No hay suficiente stock para agregar el recálculo. ${
          localInsufficientItems
            .map((item) =>
              `${item.ingredient_name}: requiere ${formatQuantity(item.quantity_per_plate * desiredPlateCount, item.unit)}, disponible ${formatQuantity(item.available_quantity, item.unit)}`
            )
            .join('; ')
        }.`,
      )
      return
    }

    setIngredients((prev) => recalculateIngredients(prev, desiredPlateCount))
    setPlateCount(desiredPlateCount)
    setSaveError('')
  }

  async function loadCreatedLunches() {
    setCreatedLunchesLoading(true)
    setCreatedLunchesError('')

    try {
      const data = await lunchApi.listLunches()
      setCreatedLunches(data)
    } catch {
      setCreatedLunchesError('No se pudieron cargar los almuerzos del servidor.')
    } finally {
      setCreatedLunchesLoading(false)
    }
  }

  function openCreatedLunchesModal() {
    setCreatedLunchesOpen(true)
    loadCreatedLunches()
  }

  async function openLunchDetail(lunchId: number) {
    setLunchDetailOpen(true)
    setLunchDetail(null)
    setLunchDetailError('')
    setLunchDetailLoading(true)

    try {
      const data = await lunchApi.getLunch(lunchId)
      setLunchDetail(data)
    } catch {
      setLunchDetailError('No se pudo cargar el detalle del almuerzo.')
    } finally {
      setLunchDetailLoading(false)
    }
  }

  async function handleSave() {
    const trimmedName = lunchName.trim()

    if (!trimmedName) {
      setSaveError('Ingresa el nombre del almuerzo.')
      return
    }

    if (ingredients.length === 0) {
      setSaveError('Agrega al menos un ingrediente al almuerzo.')
      return
    }

    const localInsufficientItems = ingredients.filter((item) => item.quantity_per_plate * desiredPlateCount > item.available_quantity)
    if (localInsufficientItems.length > 0) {
      setSaveError(
        `No hay suficiente stock para guardar el almuerzo. ${
          localInsufficientItems
            .map((item) =>
              `${item.ingredient_name}: requiere ${formatQuantity(item.quantity_per_plate * desiredPlateCount, item.unit)}, disponible ${formatQuantity(item.available_quantity, item.unit)}`
            )
            .join('; ')
        }.`,
      )
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      const payload = {
        name: trimmedName,
        date,
        platesQuantity: desiredPlateCount,
        basePlatesQuantity: plateCount,
        ingredients: [],
      }

      const createdLunch = await lunchApi.createLunch(payload)

      await Promise.all(
        lunchIngredientPayloads.map((ingredientPayload) =>
          lunchApi.addLunchIngredient(createdLunch.id, ingredientPayload),
        ),
      )

      const lunchToRecalculate = await lunchApi.getLunch(createdLunch.id)
      const recalculatedLunch = await lunchApi.recalculateLunch(createdLunch.id, {
        ...lunchToRecalculate,
        platesQuantity: desiredPlateCount,
        basePlatesQuantity: plateCount,
      })

      const stockValidation = await lunchApi.validateStock(createdLunch.id)
      if (!stockValidation.isValid) {
        setSaveError(buildInsufficientStockMessage(stockValidation.items))
        return
      }

      await lunchApi.confirmLunch(createdLunch.id, recalculatedLunch)

      if (saveAsTemplate) {
        await lunchApi.createLunchTemplate({
          ...payload,
          lunchId: createdLunch.id,
          ingredients: lunchIngredientPayloads,
        })
        const templates = await lunchApi.listLunchTemplates()
        setPreloadedTemplates(templates.map(mapTemplateToPreloaded))
      }

      if (createdLunchesOpen) {
        await loadCreatedLunches()
      }

      const updatedPantry = await inventoryApi.listItems()
      setPantry(updatedPantry.map(mapInventoryItemToPantry))

      alert(saveAsTemplate ? 'Almuerzo confirmado y plantilla guardada correctamente.' : 'Almuerzo confirmado correctamente.')
    } catch {
      setSaveError(
        saveAsTemplate
          ? 'No se pudo guardar el almuerzo y la plantilla. Intenta nuevamente.'
          : 'No se pudo guardar el almuerzo. Intenta nuevamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDownload() {
    const trimmedName = lunchName.trim()

    if (!trimmedName) {
      setSaveError('Ingresa el nombre del almuerzo antes de descargar la lista.')
      return
    }

    if (ingredients.length === 0) {
      setSaveError('Agrega al menos un ingrediente antes de descargar la lista.')
      return
    }

    setSaveError('')

    try {
      const [unetLogo, deanLogo] = await Promise.all([
        loadPdfImage(logoUnetDataUri, 500, 500),
        loadPdfImage(logoDecanatoDataUri, 1000, 500),
      ])

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const generatedAt = new Date().toLocaleString('es-VE', {
        dateStyle: 'long',
        timeStyle: 'short',
      })

      function drawHeader() {
        doc.addImage(unetLogo, 'PNG', 14, 8, 22, 22)
        doc.addImage(deanLogo, 'PNG', pageWidth - 58, 10, 44, 20)
        doc.setTextColor(3, 33, 106)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TÁCHIRA', pageWidth / 2, 13, { align: 'center' })
        doc.setFontSize(10)
        doc.text('VICERRECTORADO ACADÉMICO', pageWidth / 2, 18, { align: 'center' })
        doc.text('DECANATO DE DESARROLLO ESTUDIANTIL', pageWidth / 2, 23, { align: 'center' })
        doc.setDrawColor(3, 33, 106)
        doc.setLineWidth(0.6)
        doc.line(14, 34, pageWidth - 14, 34)
      }

      function drawFooter(pageNumber: number) {
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.3)
        doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text('Sistema de Comedor Universitario - Lista de preparación de almuerzo', 14, pageHeight - 8)
        doc.text(`Página ${pageNumber}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
      }

      drawHeader()
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(17)
      doc.text('LISTA DE INGREDIENTES DEL ALMUERZO', pageWidth / 2, 44, { align: 'center' })

      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(203, 213, 225)
      doc.roundedRect(14, 50, pageWidth - 28, 25, 2, 2, 'FD')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.setFont('helvetica', 'bold')
      doc.text('ALMUERZO', 20, 58)
      doc.text('FECHA DE PREPARACIÓN', 105, 58)
      doc.text('CANTIDAD DE PLATOS', 176, 58)
      doc.text('FECHA DE EMISIÓN', 230, 58)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 23, 42)
      doc.text(trimmedName, 20, 66, { maxWidth: 76 })
      doc.text(formatPdfDate(date), 105, 66)
      doc.text(plateCount.toLocaleString('es-VE'), 176, 66)
      doc.text(generatedAt, 230, 66, { maxWidth: 50 })

      autoTable(doc, {
        startY: 82,
        margin: { top: 42, right: 14, bottom: 20, left: 14 },
        head: [[
          'N.º',
          'Ingrediente',
          'Categoría',
          `Cantidad calculada (${plateCount} platos)`,
          'Cantidad por plato',
          'Stock disponible',
        ]],
        body: ingredients.map((item, index) => [
          index + 1,
          item.ingredient_name,
          item.category,
          formatQuantity(item.calculated_quantity, item.unit),
          formatQuantity(item.quantity_per_plate, item.unit),
          formatQuantity(item.available_quantity, item.unit),
        ]),
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3,
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
          textColor: [30, 41, 59],
          valign: 'middle',
        },
        headStyles: {
          fillColor: [3, 33, 106],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center' },
          1: { cellWidth: 58 },
          2: { cellWidth: 45 },
          3: { cellWidth: 48, halign: 'right' },
          4: { cellWidth: 45, halign: 'right' },
          5: { cellWidth: 45, halign: 'right' },
        },
        didDrawPage: ({ pageNumber }) => {
          if (pageNumber > 1) drawHeader()
          drawFooter(pageNumber)
        },
      })

      const filename = trimmedName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase()

      doc.save(`lista-almuerzo-${filename || date}-${date}.pdf`)
    } catch {
      setSaveError('No se pudo generar el archivo PDF. Intenta nuevamente.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-black sm:text-4xl">Crear Almuerzo</h1>

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

      <div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={openCreatedLunchesModal}
        >
          Ver almuerzos creados
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] xl:items-start">
        <div className="min-w-0 space-y-6">
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

          {saveError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}

          <LunchFooterActions
            onSave={handleSave}
            onDownload={handleDownload}
            saving={saving}
            downloadDisabled={downloadDisabled || saving}
            saveAsTemplate={saveAsTemplate}
            onSaveAsTemplateChange={setSaveAsTemplate}
          />
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
              disabled={!selectedPantryId || !hasValidEditQty || selectedIngredientAlreadyAdded || exceedsSelectedStock}
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
            label={`Cantidad calculada (${plateCount} platos)`}
            type="number"
            min="0"
            step="0.01"
            value={editQty}
            onChange={(e) => setEditQty(e.target.value)}
            fullWidth
          />
          {selectedStockError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {selectedStockError}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={createdLunchesOpen}
        onClose={() => setCreatedLunchesOpen(false)}
        title="Almuerzos creados"
        size="md"
        footer={
          <Button variant="ghost" size="sm" onClick={() => setCreatedLunchesOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          {createdLunchesError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {createdLunchesError}
            </div>
          )}

          {createdLunchesLoading ? (
            <div className="rounded-md border border-slate-200 bg-white px-3 py-8 text-center text-sm text-slate-500">
              Cargando almuerzos...
            </div>
          ) : createdLunches.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
              No hay almuerzos creados.
            </div>
          ) : (
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200">
              {createdLunches.map((lunch) => (
                <li key={lunch.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition hover:bg-blue-50"
                    onClick={() => openLunchDetail(lunch.id)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {lunch.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        Fecha del almuerzo: {formatDisplayDate(lunch.date)}
                      </span>
                    </span>
                    <span className="text-xs font-semibold text-[#03216a]">Ver detalle</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Modal>

      <Modal
        open={lunchDetailOpen}
        onClose={() => setLunchDetailOpen(false)}
        title="Detalle del almuerzo"
        size="lg"
        footer={
          <Button variant="ghost" size="sm" onClick={() => setLunchDetailOpen(false)}>
            Cerrar
          </Button>
        }
      >
        {lunchDetailLoading && (
          <div className="py-10 text-center text-sm text-slate-500">
            Cargando detalle...
          </div>
        )}

        {lunchDetailError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {lunchDetailError}
          </div>
        )}

        {!lunchDetailLoading && !lunchDetailError && lunchDetail && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="block text-xs font-semibold uppercase text-slate-500">
                  Almuerzo
                </span>
                <span className="text-slate-900">{lunchDetail.name}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase text-slate-500">
                  Fecha de creación
                </span>
                <span className="text-slate-900">{formatDisplayDate(lunchDetail.createdAt)}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase text-slate-500">
                  Fecha del almuerzo
                </span>
                <span className="text-slate-900">{formatDisplayDate(lunchDetail.date)}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase text-slate-500">
                  Platos
                </span>
                <span className="text-slate-900">{lunchDetail.platesQuantity}</span>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Ingredientes</h3>
              {lunchIngredientDetails.length === 0 ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  El detalle del almuerzo no trae ingredientes con nombre y cantidad en la respuesta.
                </div>
              ) : (
                <Table<LunchIngredientDetail>
                  columns={lunchDetailColumns}
                  rows={lunchIngredientDetails}
                  keyField="id"
                />
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
