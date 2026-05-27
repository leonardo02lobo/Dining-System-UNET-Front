import { useState } from 'react'
import { Download, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { Table, type ColumnDef } from '../components/ui/Table'
import { type LunchIngredient } from '../types/inventory'

const MOCK_INGREDIENTS = [
  { id: 1, name: 'Papa',     category: 'Verdura',  unit: 'kg', available: 40 },
  { id: 2, name: 'Tomate',   category: 'Verdura',  unit: 'kg', available: 20 },
  { id: 3, name: 'Pollo',    category: 'Proteína', unit: 'kg', available: 50 },
  { id: 4, name: 'Arroz',    category: 'Cereal',   unit: 'kg', available: 100 },
  { id: 5, name: 'Caraotas', category: 'Cereal',   unit: 'kg', available: 30 },
  { id: 6, name: 'Cebolla',  category: 'Verdura',  unit: 'kg', available: 15 },
]

function today() {
  return new Date().toISOString().split('T')[0]
}

export function CreateLunchPage() {
  const [date, setDate]           = useState(today())
  const [ingredients, setIngredients] = useState<LunchIngredient[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Form state del modal
  const [selectedId, setSelectedId] = useState('')
  const [usedQty, setUsedQty]       = useState('')

  const ingredientOptions = MOCK_INGREDIENTS.map((i) => ({
    value: String(i.id),
    label: `${i.name} (${i.available} ${i.unit} disponibles)`,
  }))

  function handleAddIngredient() {
    const found = MOCK_INGREDIENTS.find((i) => i.id === Number(selectedId))
    if (!found || !usedQty) return

    setIngredients((prev) => {
      const exists = prev.find((i) => i.ingredient_id === found.id)
      if (exists) {
        return prev.map((i) =>
          i.ingredient_id === found.id
            ? { ...i, used_quantity: Number(usedQty) }
            : i
        )
      }
      return [
        ...prev,
        {
          ingredient_id:   found.id,
          ingredient_name: found.name,
          category:        found.category,
          unit:            found.unit,
          available_quantity: found.available,
          used_quantity:   Number(usedQty),
        },
      ]
    })
    setSelectedId('')
    setUsedQty('')
    setModalOpen(false)
  }

  function handleRemove(id: number) {
    setIngredients((prev) => prev.filter((i) => i.ingredient_id !== id))
  }

  async function handleSave() {
    setSaving(true)
    try {
      // TODO: llamada real a la API
      await new Promise((r) => setTimeout(r, 600))
      alert('Almuerzo guardado (simulación)')
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirm() {
    setConfirming(true)
    try {
      // TODO: llamada real a la API
      await new Promise((r) => setTimeout(r, 600))
      alert('Uso confirmado (simulación)')
    } finally {
      setConfirming(false)
    }
  }

  function handleDownloadPDF() {
    window.print()
  }

  const columns: ColumnDef<LunchIngredient>[] = [
    { key: 'ingredient_name', header: 'Ingrediente', sortable: true },
    { key: 'category',        header: 'Categoría' },
    { key: 'unit',            header: 'Unidad' },
    {
      key: 'available_quantity',
      header: 'Neto Disponible',
      render: (_, row) => `${row.available_quantity} ${row.unit}`,
    },
    {
      key: 'used_quantity',
      header: 'Cantidad a usar',
      render: (_, row) => `${row.used_quantity} ${row.unit}`,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Crear Almuerzo"
        subtitle="Registra el menú del día y los ingredientes necesarios"
      />

      {/* Fecha */}
      <Card variant="outlined" padding="md" className="mb-6 max-w-xs">
        <Input
          label="Fecha del Almuerzo"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          fullWidth
        />
      </Card>

      {/* Tabla de ingredientes */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-700">Ingredientes del almuerzo</h2>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Plus size={14} />}
          onClick={() => setModalOpen(true)}
        >
          Agregar Ingrediente
        </Button>
      </div>

      <Table<LunchIngredient>
        columns={columns}
        rows={ingredients}
        keyField="ingredient_id"
        emptyMessage="Aún no hay ingredientes. Agrega los que necesites."
        actions={(row) => (
          <button
            type="button"
            title="Eliminar"
            onClick={() => handleRemove(row.ingredient_id)}
            className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        )}
      />

      {/* Acciones del pie */}
      <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-4">
        <Button
          variant="secondary"
          leftIcon={<Save size={15} />}
          loading={saving}
          onClick={handleSave}
        >
          Guardar
        </Button>
        <Button
          variant="ghost"
          leftIcon={<Download size={15} />}
          onClick={handleDownloadPDF}
        >
          Descargar PDF
        </Button>
        <Button
          variant="primary"
          loading={confirming}
          onClick={handleConfirm}
          disabled={ingredients.length === 0}
        >
          Confirmar uso
        </Button>
      </div>

      {/* Modal agregar ingrediente */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar Ingrediente al Almuerzo"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddIngredient}
              disabled={!selectedId || !usedQty}
            >
              Agregar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Ingrediente"
            options={ingredientOptions}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            placeholder="Selecciona un ingrediente..."
            fullWidth
          />
          <Input
            label="Cantidad a usar"
            type="number"
            min="0"
            placeholder="0"
            value={usedQty}
            onChange={(e) => setUsedQty(e.target.value)}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  )
}
