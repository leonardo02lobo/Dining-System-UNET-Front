import type { ConsumptionReportRow } from '../../types/consumptionReport'
import { Table, type ColumnDef } from '../ui/Table'

interface ConsumptionReportTableProps {
  rows: ConsumptionReportRow[]
}

const columns: ColumnDef<ConsumptionReportRow>[] = [
  { key: 'supply_name', header: 'Insumo', sortable: true },
  { key: 'category', header: 'Categoría', sortable: true },
  {
    key: 'consumed_amount',
    header: 'Cantidad consumida',
    sortable: true,
    render: (_, row) => `${row.consumed_amount} ${row.unit}`,
  },
  { key: 'date_from', header: 'Desde', sortable: true },
  { key: 'date_to', header: 'Hasta', sortable: true },
]

export function ConsumptionReportTable({ rows }: ConsumptionReportTableProps) {
  return (
    <Table<ConsumptionReportRow>
      columns={columns}
      rows={rows}
      keyField="id"
      emptyMessage="No hay datos en el rango seleccionado."
    />
  )
}
