import { BarChart } from '../ui/Chart'
import { Card } from '../ui/Card'
import type { StatBucket } from '../../types/statistics'

const COLOR = 'rgba(37, 99, 235, 0.7)'
const BORDER_COLOR = 'rgba(37, 99, 235, 1)'

interface AttendanceByPersonTypeChartProps {
  data: StatBucket[]
}

export function AttendanceByPersonTypeChart({ data }: AttendanceByPersonTypeChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
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
      <Card.Header title="Asistencia por tipo de persona" />
      <Card.Body>
        <BarChart data={chartData} />
      </Card.Body>
    </Card>
  )
}
