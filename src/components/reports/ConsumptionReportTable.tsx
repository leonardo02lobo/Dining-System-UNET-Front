import type { ConsumptionReportRow } from '../../types/consumptionReport'

interface ConsumptionReportTableProps {
  rows: ConsumptionReportRow[]
}

export function ConsumptionReportTable({ rows }: ConsumptionReportTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-[15px] sm:text-base">
        <thead>
          <tr className="bg-[#d9d9d9]">
            <th className="rounded-tl-[10px] border border-black px-2 py-3 text-center font-medium text-black">
              Insumo
            </th>
            <th className="border border-black px-2 py-3 text-center font-medium text-black">
              Categoría
            </th>
            <th className="border border-black px-2 py-3 text-center font-medium text-black">
              Cantidad Consumida
            </th>
            <th className="border border-black px-2 py-3 text-center font-medium text-black">
              Unidad
            </th>
            <th className="rounded-tr-[10px] border border-black px-2 py-3 text-center font-medium text-black">
              Periodo
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="border border-black px-4 py-8 text-center text-slate-500">
                No hay datos en el rango seleccionado.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="bg-white">
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {row.supply_name}
                </td>
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {row.category}
                </td>
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {row.consumed_amount}
                  {row.unit}
                </td>
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {row.unit}
                </td>
                <td className="border border-black px-2 py-2.5 text-center text-black">
                  {row.period}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
