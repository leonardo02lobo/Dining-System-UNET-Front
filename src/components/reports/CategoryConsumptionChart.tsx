import type { ChartOptions } from 'chart.js'
import { PieChart } from '../ui/Chart'
import type { CategoryConsumption } from '../../types/consumptionReport'

interface CategoryConsumptionChartProps {
  data: CategoryConsumption[]
}

export function CategoryConsumptionChart({ data }: CategoryConsumptionChartProps) {
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
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
  }

  return (
    <div className="rounded-[10px] bg-[#d9d9d9] p-4">
      <h2 className="text-xl font-normal text-black">Consumo por categoría</h2>
      <p className="mt-1 text-xs text-black">Total Consumido en el periodo</p>

      <div className="mt-3 h-[180px]">
        <PieChart data={pieData} options={options} />
      </div>

      <ul className="mt-3 space-y-2">
        {data.map((item) => (
          <li key={item.category} className="flex items-center gap-2 text-xs text-black">
            <span
              className="h-[15px] w-[15px] flex-shrink-0 rounded-[5px]"
              style={{ backgroundColor: item.color }}
            />
            {item.category}
          </li>
        ))}
      </ul>
    </div>
  )
}
