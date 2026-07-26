import { BarChart } from '../ui/Chart'
import { Card } from '../ui/Card'

interface AttendanceServedVsPlannedChartProps {
  plannedCount: number | null
  servedCount: number
}

/** Comparación planificados/servidos del turno completo — no se filtra por demografía. */
export function AttendanceServedVsPlannedChart({ plannedCount, servedCount }: AttendanceServedVsPlannedChartProps) {
  const chartData = {
    labels: ['Planificados', 'Servidos'],
    datasets: [
      {
        label: 'Platos',
        data: [plannedCount ?? 0, servedCount],
        backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(16, 185, 129, 0.7)'],
        borderColor: ['rgba(37, 99, 235, 1)', 'rgba(16, 185, 129, 1)'],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  return (
    <Card variant="outlined" padding="md">
      <Card.Header title="Planificados vs. servidos" subtitle="Total del turno, sin filtros" />
      <Card.Body>
        <BarChart data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
      </Card.Body>
    </Card>
  )
}
