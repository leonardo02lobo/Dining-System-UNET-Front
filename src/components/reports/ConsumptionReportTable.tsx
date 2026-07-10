import type { ConsumptionReportItem } from '../../types/report'
import { Table, type ColumnDef } from '../ui/Table'

interface ConsumptionReportTableProps {
  items: ConsumptionReportItem[]
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha'

  return date.toLocaleDateString('es-VE')
}

const columns: ColumnDef<ConsumptionReportItem>[] = [
  { key: 'itemName', header: 'Insumo', sortable: true },
  { key: 'categoryName', header: 'Categoría', sortable: true },
  {
    key: 'quantityConsumed',
    header: 'Cantidad consumida',
    sortable: true,
    render: (_, item) => `${item.quantityConsumed} ${item.unit}`,
  },
  {
    key: 'period',
    header: 'Desde',
    render: (_, item) => formatDisplayDate(item.period.fromDate),
  },
  {
    key: 'unit',
    header: 'Hasta',
    render: (_, item) => formatDisplayDate(item.period.toDate),
  },
]

export function ConsumptionReportTable({ items }: ConsumptionReportTableProps) {
  return (
    <Table<ConsumptionReportItem>
      columns={columns}
      rows={items}
      keyField="itemId"
      emptyMessage="No hay datos en el rango seleccionado."
    />
  )
}
