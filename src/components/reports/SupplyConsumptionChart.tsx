import type { ChartOptions } from 'chart.js'
import { BarChart } from '../ui/Chart'
import type { SupplyConsumption } from '../../types/consumptionReport'

interface SupplyConsumptionChartProps {
  data: SupplyConsumption[]
}

export function SupplyConsumptionChart({ data }: SupplyConsumptionChartProps) {
  const barData = {
    labels: data.map((d) => d.supply_name),
    datasets: [
      {
        label: 'Cantidad consumida',
        data: data.map((d) => d.total),
        backgroundColor: 'rgba(30, 33, 40, 0.85)',
        borderColor: 'rgba(30, 33, 40, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#e2e8f0', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#e2e8f0', font: { size: 10 } },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  }

  return (
    <div className="rounded-[10px] bg-[#d9d9d9] p-4">
      <h2 className="text-xl font-normal text-black">Consumo por insumo</h2>
      <p className="mt-1 text-xs text-black">Cantidad consumida (kg/L)</p>

      <div className="mt-3 rounded-lg bg-[#1e2128] p-2">
        <div className="h-[200px] [&>div]:bg-transparent [&>div]:p-0">
          <BarChart data={barData} options={options} />
        </div>
      </div>
    </div>
  )
}
