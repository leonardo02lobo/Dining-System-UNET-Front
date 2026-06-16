import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BarChart, PieChart } from '../components/ui/Chart'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DateInput } from '../components/ui/DateInput'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { notify } from '../utils/toast'
import { reportsApi } from '../api/reports'
import type { ConsumptionReportItem } from '../types/report'

const COLORS = [
  'rgba(37, 99, 235, 0.7)',
  'rgba(16, 185, 129, 0.7)',
  'rgba(245, 158, 11, 0.7)',
  'rgba(239, 68, 68, 0.7)',
  'rgba(139, 92, 246, 0.7)',
  'rgba(14, 165, 233, 0.7)',
]

function toIsoDate(daysAgo = 0) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha'

  return date.toLocaleDateString('es-VE')
}

function formatPeriod(item: ConsumptionReportItem) {
  return `${formatDisplayDate(item.period.fromDate)} - ${formatDisplayDate(item.period.toDate)}`
}

function formatQuantity(value: number, unit: string) {
  return `${Number(value.toFixed(2))} ${unit}`
}

function getReportedPeriod(items: ConsumptionReportItem[]) {
  const periods = new Set(items.map(formatPeriod))
  if (periods.size === 0) return 'Sin periodo'
  if (periods.size === 1) return Array.from(periods)[0]

  return 'Varios periodos'
}

export function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<ConsumptionReportItem[] | null>(null)
  const [dateFrom, setDateFrom] = useState(toIsoDate(30))
  const [dateTo, setDateTo] = useState(toIsoDate(0))

  const loadReport = useCallback(async () => {
    setLoading(true)

    try {
      const data = await reportsApi.consumptionReports({
        fromDate: toIsoDate(80),
        toDate: toIsoDate(0),
      })
      setItems(data)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReport()
  }, [loadReport])

  const rows = items ?? []
  const reportedPeriod = getReportedPeriod(rows)

  const totalsByUnit = useMemo(() => {
    const totals = new Map<string, number>()
    rows.forEach((item) => {
      totals.set(item.unit, (totals.get(item.unit) ?? 0) + item.quantityConsumed)
    })

    return Array.from(totals.entries()).map(([unit, total]) => ({ unit, total }))
  }, [rows])

  const categoryChartData = useMemo(() => {
    const totals = new Map<string, number>()
    rows.forEach((item) => {
      const key = `${item.categoryName} (${item.unit})`
      totals.set(key, (totals.get(key) ?? 0) + item.quantityConsumed)
    })

    const entries = Array.from(totals.entries())
    return {
      labels: entries.map(([label]) => label),
      datasets: [
        {
          data: entries.map(([, total]) => total),
          backgroundColor: entries.map((_, index) => COLORS[index % COLORS.length]),
          borderWidth: 1,
        },
      ],
    }
  }, [rows])

  const itemChartData = useMemo(() => {
    const topItems = [...rows]
      .sort((a, b) => b.quantityConsumed - a.quantityConsumed)
      .slice(0, 8)

    return {
      labels: topItems.map((item) => `${item.itemName} (${item.unit})`),
      datasets: [
        {
          label: 'Cantidad consumida',
          data: topItems.map((item) => item.quantityConsumed),
          backgroundColor: COLORS[0],
          borderColor: COLORS[0].replace('0.7', '1'),
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    }
  }, [rows])

  function handleDownload() {
    if (rows.length === 0) {
      notify.info('No hay datos para exportar.')
      return
    }

    const doc = new jsPDF()
    doc.text('Reporte de consumo de insumos', 14, 15)
    doc.setFontSize(11)
    doc.text(`Periodo: ${reportedPeriod}`, 14, 23)

    autoTable(doc, {
      startY: 30,
      head: [['Insumo', 'Categoria', 'Cantidad consumida', 'Unidad', 'Periodo']],
      body: rows.map((item) => [
        item.itemName,
        item.categoryName,
        Number(item.quantityConsumed.toFixed(2)),
        item.unit,
        formatPeriod(item),
      ]),
    })

    doc.save('reporte-consumo-insumos.pdf')
  }

  return (
    <div>
      <PageHeader
        title="Reportes del Comedor"
        subtitle="Visualiza el consumo acumulado de insumos"
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              loading={loading}
              onClick={loadReport}
            >
              Actualizar Reporte
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleDownload}
              disabled={rows.length === 0}
            >
              Descargar PDF
            </Button>
          </>
        }
      />

      {/* Filtros de fecha */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-wrap gap-6">
          <DateInput
            label="Desde"
            value={dateFrom}
            onChange={setDateFrom}
            maxDate={dateTo || undefined}
            className="w-48"
          />
          <DateInput
            label="Hasta"
            value={dateTo}
            onChange={setDateTo}
            minDate={dateFrom || undefined}
            className="w-48"
          />
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && items !== null && rows.length === 0 && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          No hay consumos registrados hasta el momento.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card variant="outlined" padding="md">
              <p className="text-xs uppercase tracking-wide text-slate-400">Insumos consumidos</p>
              <p className="mt-1 text-3xl font-bold text-blue-600">{rows.length}</p>
            </Card>
            <Card variant="outlined" padding="md">
              <p className="text-xs uppercase tracking-wide text-slate-400">Categorias</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {new Set(rows.map((item) => item.categoryName)).size}
              </p>
            </Card>
            <Card variant="outlined" padding="md">
              <p className="text-xs uppercase tracking-wide text-slate-400">Periodo reportado</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{reportedPeriod}</p>
            </Card>
          </div>

          {totalsByUnit.length > 0 && (
            <Card variant="outlined" padding="md" className="mb-6">
              <Card.Header title="Totales por unidad" />
              <Card.Body>
                <div className="flex flex-wrap gap-3">
                  {totalsByUnit.map((item) => (
                    <span
                      key={item.unit}
                      className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                    >
                      {formatQuantity(item.total, item.unit)}
                    </span>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="outlined" padding="md">
              <Card.Header title="Consumo por categoria" subtitle="Agrupado por categoria y unidad" />
              <Card.Body>
                <PieChart data={categoryChartData} />
              </Card.Body>
            </Card>

            <Card variant="outlined" padding="md">
              <Card.Header title="Insumos mas consumidos" subtitle="Primeros 8 por cantidad" />
              <Card.Body>
                <BarChart data={itemChartData} />
              </Card.Body>
            </Card>
          </div>

          <Card variant="outlined" padding="md">
            <Card.Header title="Detalle de consumo de insumos" />
            <Card.Body>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-4">Insumo</th>
                      <th className="pb-2 pr-4">Categoria</th>
                      <th className="pb-2 pr-4">Cantidad consumida</th>
                      <th className="pb-2 pr-4">Unidad</th>
                      <th className="pb-2">Periodo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item) => (
                      <tr
                        key={`${item.itemId}-${item.unit}-${item.period.fromDate}-${item.period.toDate}`}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-2 pr-4 font-medium text-slate-700">{item.itemName}</td>
                        <td className="py-2 pr-4 text-slate-500">{item.categoryName}</td>
                        <td className="py-2 pr-4 font-semibold text-blue-600">
                          {Number(item.quantityConsumed.toFixed(2))}
                        </td>
                        <td className="py-2 pr-4 text-slate-500">{item.unit}</td>
                        <td className="py-2 text-slate-500">{formatPeriod(item)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  )
}
