import { BarChart } from '../ui/Chart'
import { Card } from '../ui/Card'
import type { DateStatBucket } from '../../types/statistics'

const COLOR = 'rgba(139, 92, 246, 0.7)'
const BORDER_COLOR = 'rgba(139, 92, 246, 1)'

function formatDay(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
}

interface AttendanceByDateChartProps {
  data: DateStatBucket[]
  title?: string
}

export function AttendanceByDateChart({ data, title = 'Asistencia por día' }: AttendanceByDateChartProps) {
  const chartData = {
    labels: data.map((d) => formatDay(d.date)),
    datasets: [
      {
        label: 'Personas atendidas',
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
      <Card.Header title={title} />
      <Card.Body>
        <BarChart data={chartData} />
      </Card.Body>
    </Card>
  )
}
