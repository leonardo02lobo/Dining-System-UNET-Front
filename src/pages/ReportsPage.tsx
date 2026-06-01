import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { BarChart, PieChart } from '../components/ui/Chart'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import { Table, type ColumnDef } from '../components/ui/Table'
import { Spinner } from '../components/ui/Spinner'
import { userApi } from '../api/user'
import type { UserAccount } from '../types/user'

interface ConsumeRecord {
  id: number
  date: string
  student_name: string
  career: string
  meal: string
}

const MOCK_DATA: ConsumeRecord[] = [
  { id: 1, date: '2026-05-20', student_name: 'Ana Pérez',      career: 'Ingeniería Industrial',  meal: 'Almuerzo' },
  { id: 2, date: '2026-05-20', student_name: 'Luis Torres',    career: 'Ingeniería de Sistemas', meal: 'Almuerzo' },
  { id: 3, date: '2026-05-21', student_name: 'María García',   career: 'Arquitectura',           meal: 'Almuerzo' },
  { id: 4, date: '2026-05-21', student_name: 'Carlos Ruiz',    career: 'Ingeniería Civil',       meal: 'Almuerzo' },
  { id: 5, date: '2026-05-22', student_name: 'Sofía Medina',   career: 'Ingeniería Industrial',  meal: 'Almuerzo' },
  { id: 6, date: '2026-05-22', student_name: 'Pedro Alvarado', career: 'Ingeniería de Sistemas', meal: 'Almuerzo' },
]

function todayIso() {
  return new Date().toISOString().split('T')[0]
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(daysAgo(30))
  const [dateTo,   setDateTo]   = useState(todayIso())
  const [loading,  setLoading]  = useState(false)
  const [records,  setRecords]  = useState<ConsumeRecord[]>(MOCK_DATA)

  const [users,        setUsers]        = useState<UserAccount[]>([])
  const [usersLoading, setUsersLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const data = await userApi.list()
        setUsers(data)
      } catch {
      } finally {
        setUsersLoading(false)
      }
    })()
  }, [])

  async function handleGenerate() {
    setLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 700))
      setRecords(MOCK_DATA)
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() { window.print() }

  const careerCounts = records.reduce<Record<string, number>>((acc, r) => {
    acc[r.career] = (acc[r.career] ?? 0) + 1
    return acc
  }, {})

  const barData = {
    labels: Object.keys(careerCounts),
    datasets: [
      {
        label: 'Consumos',
        data: Object.values(careerCounts),
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderColor:     'rgba(37, 99, 235, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const pieData = {
    labels: ['Almuerzo', 'Desayuno', 'Merienda'],
    datasets: [
      {
        data: [records.length, 0, 0],
        backgroundColor: [
          'rgba(37, 99, 235, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
        ],
        borderWidth: 1,
      },
    ],
  }

  // --- Gráficas de usuarios ---
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role.name] = (acc[u.role.name] ?? 0) + 1
    return acc
  }, {})

  const userBarData = {
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

  const userPieData = {
    labels: ['Super Admin', 'Admin', 'Taquillero'],
    datasets: [
      {
        data: [roleCounts['SUPER_ADMIN'] ?? 0, roleCounts['ADMIN'] ?? 0, roleCounts['TAQUILLERO'] ?? 0],
        backgroundColor: ['rgba(37, 99, 235, 0.7)', 'rgba(251, 146, 60, 0.7)', 'rgba(100, 116, 139, 0.7)'],
        borderWidth: 1,
      },
    ],
  }

  const columns: ColumnDef<ConsumeRecord>[] = [
    { key: 'date',         header: 'Fecha',      sortable: true },
    { key: 'student_name', header: 'Estudiante', sortable: true },
    { key: 'career',       header: 'Carrera',    sortable: true },
    { key: 'meal',         header: 'Comida' },
  ]

  return (
    <div>
      <PageHeader
        title="Reportes del Comedor"
        subtitle="Visualiza y exporta estadísticas de consumo"
        actions={
          <>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<RefreshCw size={14} />}
              loading={loading}
              onClick={handleGenerate}
            >
              Generar Reporte
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download size={14} />}
              onClick={handleDownload}
            >
              Descargar Reporte
            </Button>
          </>
        }
      />

      {/* Filtros de fecha */}
      <Card variant="outlined" padding="md" className="mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Desde"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="Hasta"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          {/* Gráficas de consumo */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="outlined" padding="md">
              <Card.Header title="Consumo por categoría" subtitle="Distribución de tipos de comida" />
              <Card.Body>
                <PieChart data={pieData} />
              </Card.Body>
            </Card>

            <Card variant="outlined" padding="md">
              <Card.Header title="Consumo por carrera" subtitle="Consumos agrupados por carrera" />
              <Card.Body>
                <BarChart data={barData} />
              </Card.Body>
            </Card>
          </div>

          {/* Tabla de registros */}
          <Table<ConsumeRecord>
            columns={columns}
            rows={records}
            keyField="id"
            emptyMessage="No hay registros en el rango de fechas seleccionado."
          />
        </>
      )}

      {/* Gráficas de usuarios del sistema */}
      <div className="mt-8">
        <h2 className="mb-4 text-base font-semibold text-slate-700">Estadísticas de Usuarios</h2>
        {usersLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card variant="outlined" padding="md">
              <Card.Header title="Distribución por rol" subtitle="Gráfico circular" />
              <Card.Body>
                <PieChart data={userPieData} />
              </Card.Body>
            </Card>

            <Card variant="outlined" padding="md">
              <Card.Header title="Usuarios por rol" subtitle="Gráfico de barras" />
              <Card.Body>
                <BarChart data={userBarData} />
              </Card.Body>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
