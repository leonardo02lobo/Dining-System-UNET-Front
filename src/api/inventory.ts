import { apiClient } from './client'
import type {
  InventoryCategory,
  InventoryCategoryCreatePayload,
  InventoryItem,
  InventoryItemCreatePayload,
  InventoryItemUpdatePayload,
} from '../types/inventory'

const CATEGORY_PATH = '/inventory/categories'
const ITEM_PATH = '/inventory/items'

export const inventoryApi = {
  listCategories: () => apiClient.get<InventoryCategory[]>(CATEGORY_PATH),
  createCategory: (data: InventoryCategoryCreatePayload) =>
    apiClient.post<InventoryCategory>(CATEGORY_PATH, data),
  deleteCategory: (categoryId: number) =>
    apiClient.delete<void>(`${CATEGORY_PATH}/${categoryId}`),
  listItems: () => apiClient.get<InventoryItem[]>(ITEM_PATH),
  getItem: (itemId: number) => apiClient.get<InventoryItem>(`${ITEM_PATH}/${itemId}`),
  createItem: (data: InventoryItemCreatePayload) =>
    apiClient.post<InventoryItem>(ITEM_PATH, data),
  updateItem: (itemId: number, data: InventoryItemUpdatePayload) =>
    apiClient.patch<InventoryItem>(`${ITEM_PATH}/${itemId}`, data),
  deleteItem: (itemId: number) => apiClient.delete<void>(`${ITEM_PATH}/${itemId}`),
  exportInventoryPdf: () =>
    apiClient.getBlob('/inventory/export/pdf', 'application/pdf'),
}
