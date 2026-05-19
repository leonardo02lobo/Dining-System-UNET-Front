import { useEffect, useState } from 'react'
import { getData } from '../api/user'
import { Row } from '../types/user'
import { BarChart } from '../components/ui/Chart'

export function Dashboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const dataRows = await getData()
        setRows(dataRows)
      } catch (err: any) {
        console.error(err)
        setError(err.message ?? 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  if (loading) {
    return <p className="text-sm text-slate-300">Cargando gráfica...</p>
  }

  if (error) {
    return <p className="text-sm text-red-400">Error: {error}</p>
  }

  const genderCounts = rows.reduce(
    (accumulator, row) => {
      if (row.gender === 'male') accumulator.male += 1
      if (row.gender === 'female') accumulator.female += 1

      return accumulator
    },
    { male: 0, female: 0 }
  )

  const genderChartData = {
    labels: ['Hombres', 'Mujeres'],
    datasets: [
      {
        label: 'Cantidad de usuarios',
        data: [genderCounts.male, genderCounts.female],
        backgroundColor: ['rgba(14, 165, 233, 0.8)', 'rgba(244, 114, 182, 0.8)'],
        borderColor: ['rgba(14, 165, 233, 1)', 'rgba(244, 114, 182, 1)'],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <span className="inline-flex rounded-full border border-sky-300/30 bg-sky-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-sky-100">
        Dashboard
      </span>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Usuarios por sexo</h2>
          <p className="text-sm text-slate-400">Conteo obtenido desde `getData()` agrupado por `gender`.</p>
        </div>

        <BarChart data={genderChartData} />
      </section>
    </div>
  )
}