import { useCallback, useEffect, useMemo, useState } from 'react'
import { inventoryApi } from '../api/inventory'
import { InventorySummaryPanel } from '../components/inventory/InventorySummaryPanel'
import { InventoryTable } from '../components/inventory/InventoryTable'
import { InventoryToolbar } from '../components/inventory/InventoryToolbar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import {
  INGREDIENT_CATEGORIES,
  UNIT_OPTIONS,
  type Ingredient,
  type InventoryCategory,
  type InventoryItem,
  type StockAlert,
} from '../types/inventory'

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

function formatApiDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(new Date())

  return formatDate(date)
}

function mapInventoryItem(item: InventoryItem): Ingredient {
  return {
    id: item.id,
    name: item.name,
    category: item.category?.name ?? 'Sin categoría',
    unit: item.unit,
    quantity: item.currentStock,
    min_stock: item.minimumStock,
    last_updated: formatApiDate(item.lastUpdatedAt || item.updatedAt || item.createdAt),
    expiration_date: null,
  }
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

function buildFallbackCategories(): InventoryCategory[] {
  return INGREDIENT_CATEGORIES.map((name, index) => ({
    id: index + 1,
    name,
    createdAt: '',
    updatedAt: '',
  }))
}

function formatCategoryDate(value: string) {
  if (!value) return 'Sin fecha'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin fecha'

  return date.toLocaleDateString('es-VE')
}

export function InventoryPage() {
  const [items, setItems] = useState<Ingredient[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Ingredient | null>(null)
  const [form, setForm] = useState<Omit<Ingredient, 'id'>>(EMPTY_FORM)
  const [categories, setCategories] = useState<InventoryCategory[]>(buildFallbackCategories)
  const [newCategory, setNewCategory] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [categoriesLoadError, setCategoriesLoadError] = useState('')
  const [itemsLoading, setItemsLoading] = useState(false)
  const [itemsLoadError, setItemsLoadError] = useState('')
  const [savingItem, setSavingItem] = useState(false)
  const [itemFormError, setItemFormError] = useState('')
  const [stockChangeReason, setStockChangeReason] = useState('')
  // Fecha de ingreso del insumo (#7); por defecto hoy. No se permite futura.
  const [entryDate, setEntryDate] = useState('')
  const [loadingDetailId, setLoadingDetailId] = useState<number | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null)
  const [updatingStockId, setUpdatingStockId] = useState<number | null>(null)
  const [deleteItemTarget, setDeleteItemTarget] = useState<Ingredient | null>(null)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<InventoryCategory | null>(null)

  const categoryNames = useMemo(
    () => categories.map((category) => category.name),
    [categories],
  )

  const categoryOptions = useMemo(
    () => categoryNames.map((category) => ({ value: category, label: category })),
    [categoryNames],
  )

  const loadItems = useCallback(async () => {
    setItemsLoading(true)
    setItemsLoadError('')

    try {
      const data = await inventoryApi.listItems()
      setItems(data.map(mapInventoryItem))
    } catch {
      setItemsLoadError('No se pudieron cargar los insumos del servidor.')
    } finally {
      setItemsLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadCategories() {
      setCategoriesLoading(true)
      setCategoriesLoadError('')

      try {
        const data = await inventoryApi.listCategories()
        if (!mounted) return
        setCategories(data)
      } catch {
        if (!mounted) return
        setCategoriesLoadError('No se pudieron cargar las categorías del servidor.')
      } finally {
        if (mounted) setCategoriesLoading(false)
      }
    }

    void loadCategories()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    void loadItems()
  }, [loadItems])

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
    setItemFormError('')
    setStockChangeReason('')
    setEntryDate(new Date().toISOString().split('T')[0])
    setForm({
      ...EMPTY_FORM,
      category: categoryNames[0] ?? EMPTY_FORM.category,
      last_updated: formatDate(new Date()),
    })
    setModalOpen(true)
  }

  function fillEditForm(item: Ingredient) {
    setEditTarget(item)
    setItemFormError('')
    setStockChangeReason('')
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      min_stock: item.min_stock,
      last_updated: item.last_updated,
      expiration_date: item.expiration_date ?? '',
    })
  }

  async function openEditModal(item: Ingredient) {
    setLoadingDetailId(item.id)

    try {
      const data = await inventoryApi.getItem(item.id)
      fillEditForm(mapInventoryItem(data))
      setModalOpen(true)
    } catch {
      setItemsLoadError('No se pudo cargar el detalle del insumo.')
    } finally {
      setLoadingDetailId(null)
    }
  }

  function handleRowClick(item: Ingredient) {
    openEditModal(item)
  }

  function buildStockChangeReason() {
    const trimmed = stockChangeReason.trim()
    if (trimmed) return trimmed
    if (!editTarget || editTarget.quantity === form.quantity) return 'Actualización de datos del insumo'

    return 'Ajuste de stock desde inventario'
  }

  async function handleUpdateItem(categoryId: number) {
    if (!editTarget) return

    setSavingItem(true)
    setItemFormError('')

    try {
      await inventoryApi.updateItem(editTarget.id, {
        name: form.name.trim(),
        categoryId,
        currentStock: form.quantity,
        unit: form.unit,
        minimumStock: form.min_stock,
        stockChangeReason: buildStockChangeReason(),
      })
      await loadItems()
      setModalOpen(false)
    } catch {
      setItemFormError('No se pudo actualizar el insumo. Intenta nuevamente.')
    } finally {
      setSavingItem(false)
    }
  }

  function closeItemModal() {
    if (savingItem) return
    setModalOpen(false)
    setItemFormError('')
    setStockChangeReason('')
  }

  async function handleSave() {
    const trimmedName = form.name.trim()
    const category = categories.find((item) => item.name === form.category)

    if (!trimmedName) {
      setItemFormError('Ingresa el nombre del insumo.')
      return
    }

    if (!category) {
      setItemFormError('Selecciona una categoría válida.')
      return
    }

    if (form.quantity < 0 || form.min_stock < 0) {
      setItemFormError('El stock actual y mínimo no pueden ser negativos.')
      return
    }

    if (editTarget) {
      await handleUpdateItem(category.id)
      return
    } else {
      setSavingItem(true)
      setItemFormError('')

      try {
        // Se crea el insumo con stock 0 y la entrada inicial se registra como un
        // movimiento con su fecha de ingreso (#7); si no hay stock inicial, no se registra.
        const created = await inventoryApi.createItem({
          name: trimmedName,
          categoryId: category.id,
          currentStock: 0,
          unit: form.unit,
          minimumStock: form.min_stock,
        })
        if (form.quantity > 0) {
          await inventoryApi.increaseStock(created.id, {
            quantity: form.quantity,
            reason: 'Carga inicial de insumo',
            entryDate: entryDate || undefined,
          })
        }
        await loadItems()
        setModalOpen(false)
      } catch {
        setItemFormError('No se pudo crear el insumo. Intenta nuevamente.')
      } finally {
        setSavingItem(false)
      }
    }
  }

  function handleDelete(item: Ingredient) {
    setItemsLoadError('')
    setDeleteItemTarget(item)
  }

  async function confirmDeleteItem() {
    if (!deleteItemTarget) return

    const item = deleteItemTarget
    setDeletingItemId(item.id)
    setItemsLoadError('')

    try {
      await inventoryApi.deleteItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setDeleteItemTarget(null)
    } catch {
      setItemsLoadError('No se pudo eliminar el insumo. Intenta nuevamente.')
      setDeleteItemTarget(null)
    } finally {
      setDeletingItemId(null)
    }
  }

  function openCategoriesModal() {
    setNewCategory('')
    setCategoryError('')
    setCategoriesModalOpen(true)
  }

  async function handleCreateCategory() {
    const trimmed = newCategory.trim()

    if (!trimmed) {
      setCategoryError('Ingresa el nombre de la categoría.')
      return
    }

    const alreadyExists = categoryNames.some(
      (category) => category.toLowerCase() === trimmed.toLowerCase(),
    )

    if (alreadyExists) {
      setCategoryError('Ya existe una categoría con ese nombre.')
      return
    }

    setCreatingCategory(true)

    try {
      const created = await inventoryApi.createCategory({ name: trimmed })
      setCategories((prev) => [...prev, created])
      setNewCategory('')
      setCategoryError('')
    } catch {
      setCategoryError('No se pudo crear la categoría. Intenta nuevamente.')
    } finally {
      setCreatingCategory(false)
    }
  }

  function handleDeleteCategory(category: InventoryCategory, itemCount: number) {
    if (itemCount > 0) {
      setCategoryError('No puedes eliminar una categoría con insumos asociados.')
      return
    }

    setCategoryError('')
    setDeleteCategoryTarget(category)
  }

  async function confirmDeleteCategory() {
    if (!deleteCategoryTarget) return

    const category = deleteCategoryTarget
    setDeletingCategoryId(category.id)
    setCategoryError('')

    try {
      await inventoryApi.deleteCategory(category.id)
      setCategories((prev) => prev.filter((item) => item.id !== category.id))

      if (selectedCategory === category.name) {
        setSelectedCategory(null)
      }

      if (form.category === category.name) {
        const nextCategory = categories.find((item) => item.id !== category.id)?.name ?? ''
        setForm((prev) => ({ ...prev, category: nextCategory }))
      }
      setDeleteCategoryTarget(null)
    } catch {
      setCategoryError('No se pudo eliminar la categoría. Intenta nuevamente.')
      setDeleteCategoryTarget(null)
    } finally {
      setDeletingCategoryId(null)
    }
  }

  async function adjustStock(item: Ingredient, delta: number) {
    const category = categories.find((categoryItem) => categoryItem.name === item.category)

    if (!category) {
      setItemsLoadError('No se pudo identificar la categoría del insumo.')
      return
    }

    setUpdatingStockId(item.id)
    setItemsLoadError('')

    try {
      await inventoryApi.updateItem(item.id, {
        name: item.name,
        categoryId: category.id,
        currentStock: Math.max(0, item.quantity + delta),
        unit: item.unit,
        minimumStock: item.min_stock,
        stockChangeReason: delta > 0 ? 'Aumento rápido de stock' : 'Disminución rápida de stock',
      })
      await loadItems()
    } catch {
      setItemsLoadError('No se pudo actualizar el stock del insumo. Intenta nuevamente.')
    } finally {
      setUpdatingStockId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Inventario" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[7fr_3fr] xl:items-start">
        <div className="min-w-0 space-y-4">
          <InventoryToolbar
            search={search}
            onSearchChange={setSearch}
            categories={categoryNames}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onAddItem={openAddModal}
            onManageCategories={openCategoriesModal}
          />

          {itemsLoadError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {itemsLoadError}
            </div>
          )}

          {loadingDetailId !== null && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Cargando detalle del insumo...
            </div>
          )}

          {deletingItemId !== null && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Eliminando insumo...
            </div>
          )}

          {updatingStockId !== null && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
              Actualizando stock...
            </div>
          )}

          {itemsLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Cargando insumos...
            </div>
          ) : (
            <InventoryTable
              items={filtered}
              onIncrease={(item) => adjustStock(item, 1)}
              onDecrease={(item) => adjustStock(item, -1)}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onRowClick={handleRowClick}
            />
          )}
        </div>

        <InventorySummaryPanel items={items} alerts={alerts} />
      </div>

      <Modal
        open={modalOpen}
        onClose={closeItemModal}
        title={editTarget ? 'Editar Insumo' : 'Cargar Insumo'}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={savingItem} onClick={closeItemModal}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={savingItem}
              disabled={savingItem}
              onClick={handleSave}
            >
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
            options={categoryOptions}
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
          {!editTarget && (
            <Input
              label="Fecha de ingreso del insumo"
              type="date"
              value={entryDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setEntryDate(e.target.value)}
              hint="Fecha en la que ingresó el insumo. Por defecto hoy; no se permiten fechas futuras."
              fullWidth
            />
          )}
          <Input
            label="Fecha de caducidad (opcional)"
            type="date"
            value={form.expiration_date ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, expiration_date: e.target.value }))}
            fullWidth
          />
          {editTarget && (
            <Input
              label="Motivo del cambio de stock"
              placeholder="Ej: Ajuste por conteo físico"
              value={stockChangeReason}
              onChange={(e) => setStockChangeReason(e.target.value)}
              fullWidth
            />
          )}
          {itemFormError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {itemFormError}
            </div>
          )}
        </div>
      </Modal>

      <Modal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        title="Categorías de alimentos"
        size="md"
        footer={
          <Button variant="ghost" size="sm" onClick={() => setCategoriesModalOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          <form
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateCategory()
            }}
          >
            <Input
              label="Nueva categoría"
              placeholder="Ej: Víveres"
              value={newCategory}
              error={categoryError}
              onChange={(e) => {
                setNewCategory(e.target.value)
                if (categoryError) setCategoryError('')
              }}
              fullWidth
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={creatingCategory}
              disabled={creatingCategory}
              className="h-11 sm:w-[140px]"
            >
              Crear
            </Button>
          </form>

          {categoriesLoadError && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {categoriesLoadError}
            </div>
          )}

          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              Categorías registradas
            </div>
            <ul className="max-h-72 overflow-y-auto divide-y divide-slate-200">
              {categoriesLoading && (
                <li className="px-4 py-8 text-center text-sm text-slate-500">
                  Cargando categorías...
                </li>
              )}

              {categories.map((category) => {
                const itemCount = items.filter((item) => item.category === category.name).length

                return (
                  <li
                    key={category.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">
                        {category.name}
                      </span>
                      <span className="text-xs text-slate-500">
                        Creada: {formatCategoryDate(category.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {itemCount} insumo{itemCount === 1 ? '' : 's'}
                      </span>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={deletingCategoryId === category.id}
                        disabled={deletingCategoryId !== null || itemCount > 0}
                        onClick={() => handleDeleteCategory(category, itemCount)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </li>
                )
              })}

              {!categoriesLoading && categories.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-slate-500">
                  No hay categorías registradas.
                </li>
              )}
            </ul>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteItemTarget}
        onClose={() => setDeleteItemTarget(null)}
        title="Eliminar insumo"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteItemTarget(null)}
              disabled={deletingItemId !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDeleteItem}
              loading={deletingItemId !== null}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar el insumo{' '}
          <span className="font-semibold text-slate-900">{deleteItemTarget?.name}</span>?{' '}
          Esta acción no se puede deshacer.
        </p>
      </Modal>

      <Modal
        open={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        title="Eliminar categoría"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteCategoryTarget(null)}
              disabled={deletingCategoryId !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmDeleteCategory}
              loading={deletingCategoryId !== null}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar la categoría{' '}
          <span className="font-semibold text-slate-900">{deleteCategoryTarget?.name}</span>?{' '}
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
