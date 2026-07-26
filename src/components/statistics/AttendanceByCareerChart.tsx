import { BarChart } from '../ui/Chart'
import { Card } from '../ui/Card'
import type { StatBucket } from '../../types/statistics'

const COLOR = 'rgba(16, 185, 129, 0.7)'
const BORDER_COLOR = 'rgba(16, 185, 129, 1)'

interface AttendanceByCareerChartProps {
  data: StatBucket[]
}

/** Gráfica de barras por carrera (solo estudiantes, ver design.md). */
export function AttendanceByCareerChart({ data }: AttendanceByCareerChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        label: 'Estudiantes atendidos',
        data: data.map((d) => d.value),
        backgroundColor: COLOR,
        borderColor: BORDER_COLOR,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  return (
    <Card variant="outlined" padding="md">
      <Card.Header title="Asistencia por carrera" subtitle="Solo estudiantes" />
      <Card.Body>
        <BarChart data={chartData} />
      </Card.Body>
    </Card>
  )
}
