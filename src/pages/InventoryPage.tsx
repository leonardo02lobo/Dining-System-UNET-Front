import { useState } from 'react'
import { Info, Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { FilterPanel } from '../components/ui/FilterPanel'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Table, type ColumnDef } from '../components/ui/Table'
import {
  INGREDIENT_CATEGORIES,
  UNIT_OPTIONS,
  type Ingredient,
} from '../types/inventory'

const CATEGORY_OPTIONS = INGREDIENT_CATEGORIES.map((c) => ({ value: c, label: c }))
const UNIT_SELECT_OPTIONS = UNIT_OPTIONS.map((u) => ({ value: u, label: u }))

const MOCK_INGREDIENTS: Ingredient[] = [
  { id: 1, name: 'Papa',    category: 'Verdura',  unit: 'kg',  quantity: 40,  expiration_date: '2026-06-10' },
  { id: 2, name: 'Tomate',  category: 'Verdura',  unit: 'kg',  quantity: 20,  expiration_date: '2026-06-05' },
  { id: 3, name: 'Pollo',   category: 'Proteína', unit: 'kg',  quantity: 50,  expiration_date: '2026-05-30' },
  { id: 4, name: 'Arroz',   category: 'Cereal',   unit: 'kg',  quantity: 100, expiration_date: '2026-12-31' },
  { id: 5, name: 'Caraotas',category: 'Cereal',   unit: 'kg',  quantity: 30,  expiration_date: '2026-10-15' },
  { id: 6, name: 'Cebolla', category: 'Verdura',  unit: 'kg',  quantity: 15,  expiration_date: '2026-06-20' },
]

const EMPTY_FORM: Omit<Ingredient, 'id'> = {
  name: '', category: 'Verdura', unit: 'kg', quantity: 0, expiration_date: '',
}

export function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>(MOCK_INGREDIENTS)
  const [search, setSearch]           = useState('')
  const [filterOpen, setFilterOpen]   = useState(true)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [modalOpen, setModalOpen]     = useState(false)
  const [editTarget, setEditTarget]   = useState<Ingredient | null>(null)
  const [form, setForm]               = useState<Omit<Ingredient, 'id'>>(EMPTY_FORM)

  const filtered = ingredients.filter((ing) => {
    const matchSearch = search === '' || ing.name.toLowerCase().includes(search.toLowerCase())
    const matchCat    = selectedCats.length === 0 || selectedCats.includes(ing.category)
    return matchSearch && matchCat
  })

  function openAddModal() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  function openEditModal(ing: Ingredient) {
    setEditTarget(ing)
    setForm({ name: ing.name, category: ing.category, unit: ing.unit, quantity: ing.quantity, expiration_date: ing.expiration_date ?? '' })
    setModalOpen(true)
  }

  function handleSave() {
    if (editTarget) {
      setIngredients((prev) =>
        prev.map((i) => (i.id === editTarget.id ? { ...editTarget, ...form } : i))
      )
    } else {
      const newId = Math.max(0, ...ingredients.map((i) => i.id)) + 1
      setIngredients((prev) => [...prev, { id: newId, ...form }])
    }
    setModalOpen(false)
  }

  function handleDelete(id: number) {
    if (!confirm('¿Eliminar este ingrediente?')) return
    setIngredients((prev) => prev.filter((i) => i.id !== id))
  }

  function toggleCat(cat: string) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  const columns: ColumnDef<Ingredient>[] = [
    { key: 'name',            header: 'Nombre',    sortable: true },
    { key: 'category',        header: 'Categoría', sortable: true },
    { key: 'unit',            header: 'Unidad' },
    { key: 'quantity',        header: 'Cantidad',  sortable: true },
    {
      key: 'expiration_date',
      header: 'Caducidad',
      render: (_, row) => (
        <span className={row.expiration_date ? '' : 'text-slate-300'}>
          {row.expiration_date ?? '—'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Inventario"
        subtitle="Gestiona los insumos y ingredientes disponibles"
        actions={
          <Button variant="primary" leftIcon={<Plus size={15} />} size="sm" onClick={openAddModal}>
            Agregar ingrediente
          </Button>
        }
      />

      <div className="flex gap-4">
        {/* Tabla principal */}
        <div className="flex flex-1 flex-col gap-3">
          <SearchInput
            placeholder="Buscar por nombre..."
            fullWidth
            onSearch={setSearch}
            debounceMs={200}
          />
          <Table<Ingredient>
            columns={columns}
            rows={filtered}
            keyField="id"
            emptyMessage="No hay ingredientes que coincidan con los filtros."
            actions={(row) => (
              <>
                <button
                  type="button"
                  title="Ver detalle"
                  className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <Info size={14} />
                </button>
                <button
                  type="button"
                  title="Editar"
                  onClick={() => openEditModal(row)}
                  className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  onClick={() => handleDelete(row.id)}
                  className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          />
        </div>

        {/* Panel de filtros */}
        <div className="w-52 flex-shrink-0">
          <FilterPanel
            open={filterOpen}
            onToggle={() => setFilterOpen((o) => !o)}
          >
            <div className="flex flex-col gap-2">
              {INGREDIENT_CATEGORIES.map((cat) => (
                <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(cat)}
                    onChange={() => toggleCat(cat)}
                    className="accent-blue-600"
                  />
                  {cat}
                </label>
              ))}
              {selectedCats.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCats([])}
                  className="mt-1 text-left text-xs text-blue-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </FilterPanel>
        </div>
      </div>

      {/* Modal agregar/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar Ingrediente' : 'Agregar Ingrediente'}
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
            label="Nombre"
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
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Unidad"
              options={UNIT_SELECT_OPTIONS}
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              fullWidth
            />
            <Input
              label="Cantidad"
              type="number"
              min="0"
              value={String(form.quantity)}
              onChange={(e) => setForm((f) => ({ ...f, quantity: Number(e.target.value) }))}
              fullWidth
            />
          </div>
          <Input
            label="Fecha de Caducidad"
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
