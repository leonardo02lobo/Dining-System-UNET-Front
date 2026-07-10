import { useMemo } from 'react'
import { AlertTriangle, Calendar, ClipboardList, Package } from 'lucide-react'
import type { Ingredient, StockAlert } from '../../types/inventory'
import { StockAlertItem } from './StockAlertItem'
import { SummaryStatCard } from './SummaryStatCard'

interface InventorySummaryPanelProps {
  items: Ingredient[]
  alerts: StockAlert[]
}

/** Convierte una fecha localizada "d/m/aaaa" a timestamp para comparar. NaN si no parsea. */
function parseLocalDate(value: string): number {
  const parts = value.split('/')
  if (parts.length !== 3) return NaN
  const [day, month, year] = parts.map(Number)
  return new Date(year, month - 1, day).getTime()
}

export function InventorySummaryPanel({ items, alerts }: InventorySummaryPanelProps) {
  // Resumen calculado sobre los insumos reales ya cargados (fixes.md #5).
  const summary = useMemo(() => {
    const lowStockCount = items.filter((i) => i.quantity < i.min_stock).length
    const lastUpdate = items.reduce((latest, item) => {
      if (!latest) return item.last_updated
      const latestTs = parseLocalDate(latest)
      const itemTs = parseLocalDate(item.last_updated)
      if (Number.isNaN(itemTs)) return latest
      if (Number.isNaN(latestTs) || itemTs > latestTs) return item.last_updated
      return latest
    }, items[0]?.last_updated ?? '')

    return {
      totalItems: items.length,
      lowStockCount,
      lastUpdate: lastUpdate || '—',
    }
  }, [items])

  return (
    <aside className="w-full flex-shrink-0 xl:w-[267px]">
      <div className="rounded-[10px] bg-[#d9d9d9] p-3">
        <div className="mb-3 flex items-center gap-2 px-1">
          <ClipboardList size={28} className="text-slate-800" />
          <h2 className="text-base font-bold text-slate-900">Resumen del Inventario</h2>
        </div>

        <div className="flex flex-col gap-2">
          <SummaryStatCard
            icon={<Package size={28} />}
            label="Total de insumos registrados"
            value={summary.totalItems}
          />
          <SummaryStatCard
            icon={<AlertTriangle size={28} className="text-amber-500" />}
            label="Insumos con Stock Bajo"
            value={summary.lowStockCount}
          />
          <SummaryStatCard
            icon={<Calendar size={28} />}
            label="Última Actualización"
            value={summary.lastUpdate}
          />
        </div>

        <div className="mt-3 rounded-[10px] bg-white p-3">
          <p className="mb-2 text-xs font-medium text-slate-900">Alertas de Stock</p>
          {alerts.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              No hay alertas de stock
            </p>
          ) : (
            <div>
              {alerts.map((alert) => (
                <StockAlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
