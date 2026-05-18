import React from 'react'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend,
	ChartData,
	ChartOptions,
} from 'chart.js'
import { Line, Chart } from 'react-chartjs-2'

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	PointElement,
	LineElement,
	Title,
	Tooltip,
	Legend
)

type LineData = ChartData<'line', number[], string>
type MixedData = ChartData<'bar' | 'line', number[], string>

export interface SimpleChartProps<T> {
	data?: T
	options?: ChartOptions<any>
}

export const LineChart: React.FC<SimpleChartProps<LineData>> = ({
	data,
	options,
}) => {
	const defaultData: LineData = {
		labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
		datasets: [
			{
				label: 'Usuarios activos',
				data: [12, 19, 3, 5, 2, 3],
				borderColor: 'rgba(56, 189, 248, 1)',
				backgroundColor: 'rgba(56, 189, 248, 0.2)',
				tension: 0.3,
			},
		],
	}

	const defaultOptions: ChartOptions<'line'> = {
		responsive: true,
		plugins: {
			legend: { position: 'top' },
			title: { display: true, text: 'Actividad mensual' },
		},
	}

	return (
		<div className="w-full max-w-2xl rounded-lg bg-slate-800/40 p-4">
			<Line data={data ?? defaultData} options={(options as any) ?? defaultOptions} />
		</div>
	)
}

export const MixedChart: React.FC<SimpleChartProps<MixedData>> = ({ data, options }) => {
	const defaultData: MixedData = {
		labels: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'],
		datasets: [
			{
				type: 'bar' as const,
				label: 'Comidas servidas',
				data: [120, 150, 110, 180, 160, 200],
				backgroundColor: 'rgba(99, 102, 241, 0.8)',
				yAxisID: 'y',
			},
			{
				type: 'line' as const,
				label: 'Satisfacción (%)',
				data: [78, 82, 75, 88, 85, 90],
				borderColor: 'rgba(56, 189, 248, 1)',
				backgroundColor: 'rgba(56, 189, 248, 0.2)',
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
			title: { display: true, text: 'Comidas servidas vs satisfacción' },
		},
		scales: {
			y: {
				type: 'linear',
				display: true,
				position: 'left',
				beginAtZero: true,
				title: { display: true, text: 'Comidas' },
			},
			y1: {
				type: 'linear',
				display: true,
				position: 'right',
				beginAtZero: true,
				grid: { drawOnChartArea: false },
				title: { display: true, text: 'Satisfacción (%)' },
				min: 0,
				max: 100,
			},
		},
	}

	return (
		<div className="w-full max-w-2xl rounded-lg bg-slate-800/40 p-4">
			<Chart type="bar" data={(data as any) ?? defaultData} options={(options as any) ?? defaultOptions} />
		</div>
	)
}

export default LineChart
