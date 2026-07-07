import type { ChartOptions } from 'chart.js'
import { PieChart } from '../ui/Chart'
import { formatPercent, labelWithPercent } from '../../utils/chartPercent'
import type { CategoryConsumption } from '../../types/consumptionReport'

interface CategoryConsumptionChartProps {
  data: CategoryConsumption[]
}

export function CategoryConsumptionChart({ data }: CategoryConsumptionChartProps) {
  const total = data.reduce((acc, d) => acc + d.total, 0)

  const pieData = {
    labels: data.map((d) => d.category),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: data.map((d) => d.color),
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  }

  const options: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => labelWithPercent(String(ctx.label), Number(ctx.raw), total),
        },
      },
    },
  }

  return (
    <div className="flex min-w-0 flex-col rounded-[10px] bg-[#d9d9d9] p-4 sm:p-6">
      <h2 className="text-xl font-normal text-black">Consumo por categoría</h2>
      <p className="mt-1 text-xs text-black">Total Consumido en el periodo</p>

      <div className="mx-auto mt-4 h-[260px] w-full max-w-[420px] sm:h-[320px] [&>div]:h-full [&>div]:bg-transparent [&>div]:p-0">
        <PieChart data={pieData} options={options} />
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {data.map((item) => (
          <li key={item.category} className="flex items-center gap-2 text-xs text-black">
            <span
              className="h-[15px] w-[15px] flex-shrink-0 rounded-[5px]"
              style={{ backgroundColor: item.color }}
            />
            {item.category} — {item.total} ({formatPercent(item.total, total)})
          </li>
        ))}
      </ul>
    </div>
  )
}
