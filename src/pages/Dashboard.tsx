import { useEffect, useState } from 'react'
import { userApi } from '../api/user'
import type { UserAccount } from '../types/user'
import { BarChart, PieChart } from '../components/ui/Chart'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { Spinner } from '../components/ui/Spinner'

export function Dashboard() {
  const [rows, setRows] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const dataRows = await userApi.list()
        setRows(dataRows)
      } catch (err: any) {
        setError(err.message ?? 'Error desconocido')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const roleCounts = rows.reduce(
    (acc, row) => {
      acc[row.role.name] = (acc[row.role.name] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const genderChartData = {
    labels: ['Super Admin', 'Admin', 'Taquillero'],
    datasets: [
      {
        label: 'Cantidad de usuarios',
        data: [roleCounts['SUPER_ADMIN'] ?? 0, roleCounts['ADMIN'] ?? 0, roleCounts['TAQUILLERO'] ?? 0],
        backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(251, 146, 60, 0.7)', 'rgba(100, 116, 139, 0.7)'],
        borderColor:     ['rgba(37, 99, 235, 1)',   'rgba(251, 146, 60, 1)',   'rgba(100, 116, 139, 1)'  ],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const pieData = {
    labels: ['Super Admin', 'Admin', 'Taquillero'],
    datasets: [
      {
        data: [roleCounts['SUPER_ADMIN'] ?? 0, roleCounts['ADMIN'] ?? 0, roleCounts['TAQUILLERO'] ?? 0],
        backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(251, 146, 60, 0.7)', 'rgba(100, 116, 139, 0.7)'],
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
