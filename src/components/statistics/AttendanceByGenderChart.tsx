import { PieChart } from '../ui/Chart'
import { Card } from '../ui/Card'
import { piePercentOptions } from '../../utils/chartPercent'
import type { GenderStatBucket } from '../../types/statistics'

const COLORS = ['rgba(37, 99, 235, 0.7)', 'rgba(244, 114, 182, 0.7)', 'rgba(148, 163, 184, 0.7)']

const PIE_PERCENT_OPTIONS = piePercentOptions()

interface AttendanceByGenderChartProps {
  data: GenderStatBucket[]
}

export function AttendanceByGenderChart({ data }: AttendanceByGenderChartProps) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 1,
      },
    ],
  }

  return (
    <Card variant="outlined" padding="md">
      <Card.Header title="Distribución por género" />
      <Card.Body>
        <PieChart data={chartData} options={PIE_PERCENT_OPTIONS} />
      </Card.Body>
    </Card>
  )
}
