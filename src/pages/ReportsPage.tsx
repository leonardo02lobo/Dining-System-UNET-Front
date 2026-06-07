import { useState, useCallback } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { BarChart, PieChart } from '../components/ui/Chart'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'
import { notify } from '../utils/toast'
import { reportsApi } from '../api/reports'
import type { ConsumptionReport, SanctionReport } from '../types/report'

const USER_TYPE_LABEL: Record<string, string> = {
  STUDENT:        'Estudiante',
  TEACHER:        'Docente',
  ADMINISTRATIVE: 'Administrativo',
  WORKER:         'Obrero',
}

const COLORS = [
  'rgba(37, 99, 235, 0.7)',
  'rgba(16, 185, 129, 0.7)',
  'rgba(245, 158, 11, 0.7)',
  'rgba(239, 68, 68, 0.7)',
  'rgba(139, 92, 246, 0.7)',
]

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export function ReportsPage() {
  const [dateFrom, setDateFrom]             = useState(daysAgo(30))
  const [dateTo,   setDateTo]               = useState(todayIso())
  const [loading,  setLoading]              = useState(false)
  const [report,   setReport]               = useState<ConsumptionReport | null>(null)
  const [sanctions, setSanctions]           = useState<SanctionReport | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!dateFrom || !dateTo) return
    setLoading(true)
    try {
      const [c, s] = await Promise.all([
        reportsApi.consumption({ from_date: dateFrom, to_date: dateTo }),
        reportsApi.sanctions({ from_date: dateFrom, to_date: dateTo }),
      ])
      setReport(c)
      setSanctions(s)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  // ── Chart data ──────────────────────────────────────────────────────
  const dayBarData = report
    ? {
        labels: report.by_day.map((d) => d.date),
        datasets: [
          {
            label: 'Total',
            data: report.by_day.map((d) => d.total),
            backgroundColor: COLORS[0],
            borderColor: COLORS[0].replace('0.7', '1'),
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Manuales',
            data: report.by_day.map((d) => d.manual_count),
            backgroundColor: COLORS[1],
            borderColor: COLORS[1].replace('0.7', '1'),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      }
    : null

  const typeBarData = report
    ? {
        labels: report.by_user_type.map((x) => USER_TYPE_LABEL[x.user_type] ?? x.user_type),
        datasets: [
          {
            label: 'Consumos',
            data: report.by_user_type.map((x) => x.total),
            backgroundColor: report.by_user_type.map((_, i) => COLORS[i % COLORS.length]),
            borderColor:     report.by_user_type.map((_, i) => COLORS[i % COLORS.length].replace('0.7', '1')),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      }
    : null

  const sanctionPieData = sanctions
    ? {
        labels: sanctions.by_status.map((s) => s.status),
        datasets: [
          {
            data: sanctions.by_status.map((s) => s.count),
            backgroundColor: sanctions.by_status.map((_, i) => COLORS[i % COLORS.length]),
            borderWidth: 1,
          },
        ],
      }
    : null

  // ── PDF export ──────────────────────────────────────────────────────
  function handleDownload() {
    if (!report) { notify.info('Genera el reporte primero.'); return }
    const doc = new jsPDF()
    doc.text(`Reporte de Consumos — ${dateFrom} al ${dateTo}`, 14, 15)
    doc.setFontSize(11)
    doc.text(`Total consumos: ${report.total_consumptions}`, 14, 23)

    autoTable(doc, {
      startY: 30,
      head: [['Fecha', 'Total', 'Manuales']],
      body: report.by_day.map((d) => [d.date, d.total, d.manual_count]),
    })

    const afterFirstTable = (doc as any).lastAutoTable?.finalY ?? 60
    doc.text('Consumos por tipo de usuario', 14, afterFirstTable + 10)
    autoTable(doc, {
      startY: afterFirstTable + 14,
      head: [['Tipo de Usuario', 'Total']],
      body: report.by_user_type.map((x) => [USER_TYPE_LABEL[x.user_type] ?? x.user_type, x.total]),
    })

    doc.save(`reporte-consumos-${dateFrom}-${dateTo}.pdf`)
  }

  return (
    <div>
      <PageHeader
        title="Reportes del Comedor"
        subtitle="Visualiza y exporta estadísticas de consumo"
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              loading={loading}
              onClick={handleGenerate}
            >
              Generar Reporte
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleDownload}
              disabled={!report}
            >
              Descargar PDF
            </Button>
          </>
        }
      />

      {/* Filtros de fecha */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Desde"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </Card>

      {loading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {!loading && !report && (
        <div className="rounded-md border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
          Selecciona un rango de fechas y presiona <strong>Generar Reporte</strong>.
        </div>
      )}

      {!loading && report && (
        <>
          {/* Tarjeta resumen */}
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card variant="outlined" padding="md">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Total consumos</p>
              <p className="mt-1 text-3xl font-bold text-blue-600">{report.total_consumptions}</p>
            </Card>
            <Card variant="outlined" padding="md">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Días con servicio</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">{report.by_day.length}</p>
            </Card>
            <Card variant="outlined" padding="md">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Sanciones activas</p>
              <p className="mt-1 text-3xl font-bold text-red-500">
                {sanctions?.by_status.find((s) => s.status === 'ACTIVE')?.count ?? 0}
              </p>
            </Card>
          </div>

          {/* Gráficas de consumo */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {dayBarData && (
              <Card variant="outlined" padding="md">
                <Card.Header title="Consumos por día" subtitle="Total y registros manuales" />
                <Card.Body>
                  <BarChart data={dayBarData} />
                </Card.Body>
              </Card>
            )}

            {typeBarData && (
              <Card variant="outlined" padding="md">
                <Card.Header title="Consumos por tipo de usuario" subtitle="Estudiantes, docentes, etc." />
                <Card.Body>
                  <BarChart data={typeBarData} />
                </Card.Body>
              </Card>
            )}
          </div>

          {/* Tabla de consumos por día */}
          <Card variant="outlined" padding="md" className="mb-6">
            <Card.Header title="Detalle por día" />
            <Card.Body>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-2 pr-4">Fecha</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2">Manuales</th>
                  </tr>
                </thead>
                <tbody>
                  {report.by_day.map((d) => (
                    <tr key={d.date} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-4 text-slate-700">{d.date}</td>
                      <td className="py-2 pr-4 font-semibold text-blue-600">{d.total}</td>
                      <td className="py-2 text-slate-500">{d.manual_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card.Body>
          </Card>

          {/* Sanciones */}
          {sanctions && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {sanctionPieData && (
                <Card variant="outlined" padding="md">
                  <Card.Header title="Sanciones por estado" subtitle={`Total: ${sanctions.total}`} />
                  <Card.Body>
                    <PieChart data={sanctionPieData} />
                  </Card.Body>
                </Card>
              )}

              <Card variant="outlined" padding="md">
                <Card.Header title="Principales motivos de sanción" />
                <Card.Body>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                        <th className="pb-2 pr-4">Motivo</th>
                        <th className="pb-2">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sanctions.by_reason.map((r) => (
                        <tr key={r.reason} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 pr-4 text-slate-700">{r.reason}</td>
                          <td className="py-2 font-semibold">{r.count}</td>
                        </tr>
                      ))}
                      {sanctions.by_reason.length === 0 && (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-slate-400">Sin sanciones en el período</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </Card.Body>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
