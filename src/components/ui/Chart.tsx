import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line, Chart, Pie } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

type LineData = ChartData<'line', number[], string>
type BarData  = ChartData<'bar',  number[], string>
type PieData  = ChartData<'pie',  number[], string>
type MixedData = ChartData<'bar' | 'line', number[], string>

export interface SimpleChartProps<T> {
  data?: T
  options?: ChartOptions<any>
}

/* ─── Bar Chart ─────────────────────────────────────────────── */
export const BarChart: React.FC<SimpleChartProps<BarData>> = ({ data, options }) => {
  const defaultData: BarData = {
    labels: ['Hombres', 'Mujeres'],
    datasets: [
      {
        label: 'Cantidad de usuarios',
        data: [0, 0],
        backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(244, 114, 182, 0.7)'],
        borderColor:     ['rgba(37, 99, 235, 1)',   'rgba(244, 114, 182, 1)'],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title:  { display: true, text: 'Usuarios por sexo', color: '#1e293b', font: { weight: 'bold' } },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  }

  return (
    <div className="w-full rounded-lg bg-white p-4">
      <Bar data={data ?? defaultData} options={(options as any) ?? defaultOptions} />
    </div>
  )
}

/* ─── Pie Chart ─────────────────────────────────────────────── */
export const PieChart: React.FC<SimpleChartProps<PieData>> = ({ data, options }) => {
  const defaultData: PieData = {
    labels: ['Hombres', 'Mujeres'],
    datasets: [
      {
        data: [0, 0],
        backgroundColor: [
          'rgba(37, 99, 235, 0.7)',
          'rgba(244, 114, 182, 0.7)',
        ],
        borderColor: ['rgba(37, 99, 235, 1)', 'rgba(244, 114, 182, 1)'],
        borderWidth: 1,
      },
    ],
  }

  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title:  { display: true, text: 'Distribución por sexo', color: '#1e293b', font: { weight: 'bold' } },
    },
  }

  return (
    <div className="w-full rounded-lg bg-white p-4">
      <Pie data={data ?? defaultData} options={(options as any) ?? defaultOptions} />
    </div>
  )
}

/* ─── Line Chart ─────────────────────────────────────────────── */
export const LineChart: React.FC<SimpleChartProps<LineData>> = ({ data, options }) => {
  const defaultData: LineData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        label: 'Usuarios activos',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: 'rgba(37, 99, 235, 1)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
      },
    ],
  }

  const defaultOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title:  { display: true, text: 'Actividad mensual', color: '#1e293b', font: { weight: 'bold' } },
    },
  }

  return (
    <div className="w-full rounded-lg bg-white p-4">
      <Line data={data ?? defaultData} options={(options as any) ?? defaultOptions} />
    </div>
  )
}

/* ─── Mixed Chart ───────────────────────────────────────────── */
export const MixedChart: React.FC<SimpleChartProps<MixedData>> = ({ data, options }) => {
  const defaultData: MixedData = {
    labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
    datasets: [
      {
        type: 'bar' as const,
        label: 'Comidas servidas',
        data: [120, 150, 110, 180, 160, 200],
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        yAxisID: 'y',
        borderRadius: 4,
      },
      {
        type: 'line' as const,
        label: 'Satisfacción (%)',
        data: [78, 82, 75, 88, 85, 90],
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  }

  const defaultOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      title:  { display: true, text: 'Comidas servidas vs satisfacción', color: '#1e293b', font: { weight: 'bold' } },
    },
    scales: {
      y:  { type: 'linear', display: true, position: 'left',  beginAtZero: true, title: { display: true, text: 'Comidas' } },
      y1: { type: 'linear', display: true, position: 'right', beginAtZero: true, grid: { drawOnChartArea: false }, title: { display: true, text: 'Satisfacción (%)' }, min: 0, max: 100 },
    },
  }

  return (
    <div className="w-full rounded-lg bg-white p-4">
      <Chart type="bar" data={(data as any) ?? defaultData} options={(options as any) ?? defaultOptions} />
    </div>
  )
}

export default LineChart
