import { useEffect, useState } from 'react'
import { getData } from '../api/user'
import type { Row } from '../types/user'
import { BarChart, PieChart } from '../components/ui/Chart'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'

export function Dashboard() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const dataRows = await getData()
        setRows(dataRows)
      } catch (err: any) {
        setError(err.message ?? 'Error desconocido')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const genderCounts = rows.reduce(
    (acc, row) => {
      if (row.gender === 'male') acc.male += 1
      if (row.gender === 'female') acc.female += 1
      return acc
    },
    { male: 0, female: 0 }
  )

  const genderChartData = {
    labels: ['Hombres', 'Mujeres'],
    datasets: [
      {
        label: 'Cantidad de usuarios',
        data: [genderCounts.male, genderCounts.female],
        backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(244, 114, 182, 0.7)'],
        borderColor:     ['rgba(37, 99, 235, 1)',   'rgba(244, 114, 182, 1)'],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const pieData = {
    labels: ['Hombres', 'Mujeres'],
    datasets: [
      {
        data: [genderCounts.male, genderCounts.female],
        backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(244, 114, 182, 0.7)'],
        borderColor:     ['rgba(37, 99, 235, 1)',   'rgba(244, 114, 182, 1)'],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Estadísticas generales del sistema de comedor"
      />

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" label="Cargando datos..." />
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          Error al cargar datos: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="outlined" padding="md">
            <Card.Header title="Distribución por sexo" subtitle="Gráfico circular" />
            <Card.Body>
              <PieChart data={pieData} />
            </Card.Body>
          </Card>

          <Card variant="outlined" padding="md">
            <Card.Header title="Usuarios por sexo" subtitle="Gráfico de barras" />
            <Card.Body>
              <BarChart data={genderChartData} />
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  )
}
