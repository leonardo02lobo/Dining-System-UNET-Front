import { useState } from 'react'
import { ConsumptionReportTable } from '../components/reports/ConsumptionReportTable'
import { ReportChartsPanel } from '../components/reports/ReportChartsPanel'
import { ReportDateRangeFilters } from '../components/reports/ReportDateRangeFilters'
import { Spinner } from '../components/ui/Spinner'
import {
  MOCK_CATEGORY_CONSUMPTION,
  MOCK_CONSUMPTION_ROWS,
  MOCK_SUPPLY_CONSUMPTION,
  formatDisplayDate,
} from '../data/mockConsumptionReport'
import type { ConsumptionReportRow } from '../types/consumptionReport'

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function daysAgoIso(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function buildPeriodLabel(from: string, to: string) {
  return `${formatDisplayDate(from)} - ${formatDisplayDate(to)}`
}

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(daysAgoIso(81))
  const [dateTo, setDateTo] = useState(todayIso())
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<ConsumptionReportRow[]>(MOCK_CONSUMPTION_ROWS)

  async function handleGenerate() {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 600))
      const period = buildPeriodLabel(dateFrom, dateTo)
      setRows(
        MOCK_CONSUMPTION_ROWS.map((row) => ({
          ...row,
          period,
        }))
      )
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-black sm:text-4xl">Reportes de consumo</h1>

      <ReportDateRangeFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onGenerate={handleGenerate}
        onDownload={handleDownload}
        loading={loading}
      />

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <ConsumptionReportTable rows={rows} />
          )}
        </div>

        <ReportChartsPanel
          categoryData={MOCK_CATEGORY_CONSUMPTION}
          supplyData={MOCK_SUPPLY_CONSUMPTION}
        />
      </div>
    </div>
  )
}
