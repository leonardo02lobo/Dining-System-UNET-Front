import { useMemo, useState } from 'react'
import { InventorySummaryPanel } from '../components/inventory/InventorySummaryPanel'
import { InventoryTable } from '../components/inventory/InventoryTable'
import { InventoryToolbar } from '../components/inventory/InventoryToolbar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Select } from '../components/ui/Select'
import { MOCK_INVENTORY_ITEMS } from '../data/mockInventory'
import {
  INGREDIENT_CATEGORIES,
  UNIT_OPTIONS,
  type Ingredient,
  type StockAlert,
} from '../types/inventory'

const CATEGORY_OPTIONS = INGREDIENT_CATEGORIES.map((c) => ({ value: c, label: c }))
const UNIT_SELECT_OPTIONS = UNIT_OPTIONS.map((u) => ({ value: u, label: u }))

const EMPTY_FORM: Omit<Ingredient, 'id'> = {
  name: '',
  category: 'Verdura',
  unit: 'kg',
  quantity: 0,
  min_stock: 0,
  last_updated: new Date().toLocaleDateString('es-VE'),
  expiration_date: '',
}

function formatDate(date: Date) {
  return date.toLocaleDateString('es-VE')
}

function buildAlerts(items: Ingredient[]): StockAlert[] {
  return items
    .filter((i) => i.quantity < i.min_stock)
    .map((i) => ({
      id: i.id,
      item_name: i.name,
      current_stock: i.quantity,
      min_stock: i.min_stock,
      unit: i.unit,
    }))
}

export function InventoryPage() {
  const [items, setItems] = useState<Ingredient[]>(MOCK_INVENTORY_ITEMS)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null)
  const [form, setForm] = useState<Omit<Ingredient, 'id'>>(EMPTY_FORM)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        search === '' || item.name.toLowerCase().includes(search.toLowerCase())
      const matchCategory =
        selectedCategory === null || item.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [items, search, selectedCategory])

  const alerts = useMemo(() => buildAlerts(items), [items])

  function openAddModal() {
    setEditTarget(null)
    setForm({ ...EMPTY_FORM, last_updated: formatDate(new Date()) })
    setModalOpen(true)
  }

  function openEditModal(item: Ingredient) {
    setEditTarget(item)
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      min_stock: item.min_stock,
      last_updated: item.last_updated,
      expiration_date: item.expiration_date ?? '',
    })
    setModalOpen(true)
  }

  function handleSave() {
    const today = formatDate(new Date())
    if (editTarget) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === editTarget.id
            ? { ...editTarget, ...form, last_updated: today }
            : i
        )
      )
    } else {
      const newId = Math.max(0, ...items.map((i) => i.id)) + 1
      setItems((prev) => [...prev, { id: newId, ...form, last_updated: today }])
    }
    setModalOpen(false)
  }

  function handleDelete(item: Ingredient) {
    if (!confirm(`¿Eliminar el insumo "${item.name}"?`)) return
    setItems((prev) => prev.filter((i) => i.id !== item.id))
  }

  function adjustStock(item: Ingredient, delta: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              quantity: Math.max(0, i.quantity + delta),
              last_updated: formatDate(new Date()),
            }
          : i
      )
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-black sm:text-4xl">Inventario</h1>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-4">
          <InventoryToolbar
            search={search}
            onSearchChange={setSearch}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onAddItem={openAddModal}
          />

          <InventoryTable
            items={filtered}
            onIncrease={(item) => adjustStock(item, 1)}
            onDecrease={(item) => adjustStock(item, -1)}
            onEdit={openEditModal}
            onDelete={handleDelete}
          />
        </div>

        <InventorySummaryPanel items={items} alerts={alerts} />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar Insumo' : 'Cargar Insumo'}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Guardar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre del insumo"
            placeholder="Ej: Papa"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
          />
          <Select
            label="Categoría"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            fullWidth
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select
              label="Unidad"
              options={UNIT_SELECT_OPTIONS}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              fullWidth
            />
            <Input
              label="Stock actual"
              type="number"
              min="0"
              value={String(form.quantity)}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              fullWidth
            />
            <Input
              label="Stock mínimo"
              type="number"
              min="0"
              value={String(form.min_stock)}
              onChange={(e) => setForm((f) => ({ ...f, min_stock: Number(e.target.value) }))}
              fullWidth
            />
          </div>
          <Input
            label="Fecha de caducidad (opcional)"
            type="date"
            value={form.expiration_date ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, expiration_date: e.target.value }))}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  )
}
