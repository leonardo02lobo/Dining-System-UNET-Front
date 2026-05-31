import { AlertTriangle } from 'lucide-react'
import type { StockAlert } from '../../types/inventory'

interface StockAlertItemProps {
  alert: StockAlert
}

export function StockAlertItem({ alert }: StockAlertItemProps) {
  return (
    <div className="border-b border-slate-200 py-3 last:border-0">
      <div className="flex items-start gap-2">
        <AlertTriangle size={20} className="mt-0.5 flex-shrink-0 text-amber-500" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-900">{alert.item_name}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">
            Stock actual ({alert.current_stock}
            {alert.unit}) por debajo del mínimo ({alert.min_stock}
            {alert.unit})
          </p>
        </div>
      </div>
    </div>
  )
}
