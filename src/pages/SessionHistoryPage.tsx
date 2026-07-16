import { useCallback, useEffect, useMemo, useState } from 'react'
import { BarChart3, Download, RefreshCw, Utensils } from 'lucide-react'
import { lunchSessionApi } from '../api/lunchSession'
import { consumptionApi } from '../api/consumption'
import { lunchApi } from '../api/lunch'
import { errorMessage } from '../utils/apiErrors'
import { notify } from '../utils/toast'
import { generateSessionEntrantsPdf } from '../utils/pdfSessionEntrants'
import { genderStats, careerStats, roleStats } from '../utils/sessionStats'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DateInput } from '../components/ui/DateInput'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { BarChart, PieChart } from '../components/ui/Chart'
import { Table, type ColumnDef } from '../components/ui/Table'
import { BarChart, PieChart } from '../components/ui/Chart'
import { USER_TYPE_LABEL } from '../utils/labels'
import { careerStats, genderStats, roleStats, type StatBucket } from '../utils/sessionStats'
import type { Consumption } from '../types/consumption'
import type { LunchSession } from '../types/lunchSession'
import type { LunchResponse } from '../types/lunch'

// Paleta de colores para las gráficas de la sesión (issue #3).
const CHART_COLORS = [
  'rgba(37, 99, 235, 0.7)',   // azul
  'rgba(244, 114, 182, 0.7)', // rosa
  'rgba(16, 185, 129, 0.7)',  // verde
  'rgba(245, 158, 11, 0.7)',  // ámbar
  'rgba(139, 92, 246, 0.7)',  // violeta
  'rgba(239, 68, 68, 0.7)',   // rojo
  'rgba(14, 165, 233, 0.7)',  // celeste
  'rgba(132, 204, 22, 0.7)',  // lima
  'rgba(100, 116, 139, 0.7)', // pizarra
]

function colorsFor(count: number): string[] {
  return Array.from({ length: count }, (_, i) => CHART_COLORS[i % CHART_COLORS.length])
}

/** Construye datos de PieChart a partir de segmentos etiqueta/conteo. */
function toPieData(buckets: StatBucket[]) {
  return {
    labels: buckets.map((b) => b.label),
    datasets: [
      {
        data: buckets.map((b) => b.count),
        backgroundColor: colorsFor(buckets.length),
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  }
}

/** Construye datos de BarChart a partir de segmentos etiqueta/conteo. */
function toBarData(buckets: StatBucket[], label: string) {
  return {
    labels: buckets.map((b) => b.label),
    datasets: [
      {
        label,
        data: buckets.map((b) => b.count),
        backgroundColor: colorsFor(buckets.length),
        borderRadius: 4,
      },
    ],
  }
}

function chartTitleOptions(title: string, legendPosition: 'bottom' | 'top' = 'bottom') {
  return {
    responsive: true,
    plugins: {
      legend: { position: legendPosition },
      title: { display: true, text: title, color: '#1e293b', font: { weight: 'bold' as const } },
    },
  }
}

// Opciones del filtro por rol del detalle de entrantes (issue #4).
const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'Todos los roles' },
  { value: 'STUDENT', label: USER_TYPE_LABEL.STUDENT },
  { value: 'TEACHER', label: USER_TYPE_LABEL.TEACHER },
  { value: 'ADMINISTRATIVE', label: USER_TYPE_LABEL.ADMINISTRATIVE },
  { value: 'WORKER', label: USER_TYPE_LABEL.WORKER },
]

function toIsoDate(daysAgo = 0) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha'
  return date.toLocaleDateString('es-VE')
}

/** Formatea una marca de tiempo ISO como hora local HH:mm (es-VE). */
function formatTime(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

const ROLE_FILTER_OPTIONS = [
  { value: 'ALL',            label: 'Todos los roles' },
  { value: 'STUDENT',        label: 'Estudiante' },
  { value: 'ADMINISTRATIVE', label: 'Administrativo' },
  { value: 'TEACHER',        label: 'Docente' },
  { value: 'WORKER',         label: 'Obrero' },
]

/** Paleta reutilizable para las gráficas del modal. */
const CHART_PALETTE = [
  '#2563eb', '#f472b6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#14b8a6', '#eab308', '#6366f1', '#64748b',
]

function pieData(labels: string[], data: number[]) {
  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: labels.map((_, i) => `${CHART_PALETTE[i % CHART_PALETTE.length]}b3`),
        borderColor: labels.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
        borderWidth: 1,
      },
    ],
  }
}

export function SessionHistoryPage() {
  const [dateFrom, setDateFrom] = useState(toIsoDate(30))
  const [dateTo, setDateTo] = useState(toIsoDate(0))

  const [sessions, setSessions] = useState<LunchSession[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState('')

  const [selected, setSelected] = useState<LunchSession | null>(null)
  const [entrants, setEntrants] = useState<Consumption[]>([])
  const [entrantsLoading, setEntrantsLoading] = useState(false)
  const [entrantsError, setEntrantsError] = useState('')
  const [onlyAccesoDirecto, setOnlyAccesoDirecto] = useState(false)
  const [roleFilter, setRoleFilter] = useState('ALL')

  const [menu, setMenu] = useState<LunchResponse | null>(null)
  const [menuLoading, setMenuLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [chartsOpen, setChartsOpen] = useState(false)

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    setSessionsError('')
    try {
      const res = await lunchSessionApi.listByRange({ from_date: dateFrom, to_date: dateTo })
      // Orden por fecha descendente (más reciente primero).
      const sorted = [...res.items].sort((a, b) => b.date.localeCompare(a.date))
      setSessions(sorted)
    } catch (err) {
      setSessionsError(errorMessage(err, {}, 'No se pudieron cargar las sesiones.'))
    } finally {
      setSessionsLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    void loadSessions()
  }, [loadSessions])

  const loadEntrants = useCallback(async (session: LunchSession, priorityOnly: boolean) => {
    setEntrantsLoading(true)
    setEntrantsError('')
    try {
      const res = await consumptionApi.list({
        session_id: session.id,
        is_priority: priorityOnly || undefined,
      })
      setEntrants(res.items)
    } catch (err) {
      setEntrantsError(errorMessage(err, {}, 'No se pudieron cargar los entrantes.'))
    } finally {
      setEntrantsLoading(false)
    }
  }, [])

  const loadMenu = useCallback(async (session: LunchSession) => {
    setMenuLoading(true)
    setMenu(null)
    try {
      const lunches = await lunchApi.listLunches({ date: session.date })
      setMenu(lunches[0] ?? null)
    } catch {
      setMenu(null)
    } finally {
      setMenuLoading(false)
    }
  }, [])

  function selectSession(session: LunchSession) {
    setSelected(session)
    setOnlyAccesoDirecto(false)
    setRoleFilter('ALL')
    void loadEntrants(session, false)
    void loadMenu(session)
  }

  // Filtro por rol client-side (#4): convive con "Solo acceso directo" (server-side).
  const filteredEntrants = useMemo(() => {
    if (roleFilter === 'ALL') return entrants
    return entrants.filter((e) => (e.user_type ?? '').toUpperCase() === roleFilter)
  }, [entrants, roleFilter])

  function toggleOnlyAccesoDirecto(next: boolean) {
    setOnlyAccesoDirecto(next)
    if (selected) void loadEntrants(selected, next)
  }

  async function handleDownloadPdf() {
    if (!selected || downloading) return
    setDownloading(true)
    try {
      await generateSessionEntrantsPdf({ session: selected, entrants: filteredEntrants, onlyAccesoDirecto, menu })
    } catch {
      notify.error('No se pudo generar el PDF de la sesión.')
    } finally {
      setDownloading(false)
    }
  }

  const sessionColumns: ColumnDef<LunchSession>[] = [
    { key: 'date', header: 'Fecha', sortable: true, render: (_, s) => formatDate(s.date) },
    { key: 'sede', header: 'Sede', render: (_, s) => s.sede?.name ?? '—' },
    { key: 'opened_at', header: 'Apertura', render: (_, s) => formatTime(s.opened_at) ?? '—' },
    {
      key: 'closed_at',
      header: 'Cierre',
      render: (_, s) =>
        s.closed_at
          ? formatTime(s.closed_at) ?? '—'
          : <span className="text-slate-400">En curso</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (_, s) => (
        <Badge variant={s.status === 'OPEN' ? 'success' : 'neutral'}>
          {s.status === 'OPEN' ? 'Abierta' : 'Cerrada'}
        </Badge>
      ),
    },
  ]

  const entrantColumns: ColumnDef<Consumption>[] = [
    { key: 'document_id', header: 'Cédula', sortable: true, render: (_, e) => e.document_id ?? '—' },
    { key: 'last_name', header: 'Apellido', sortable: true, render: (_, e) => e.last_name ?? '—' },
    { key: 'first_name', header: 'Nombre', sortable: true, render: (_, e) => e.first_name ?? '—' },
    { key: 'career', header: 'Carrera', render: (_, e) => e.career ?? '—' },
    {
      key: 'is_priority',
      header: 'Acceso directo',
      render: (_, e) =>
        e.is_priority ? <Badge variant="info">Acceso directo</Badge> : <span className="text-slate-400">—</span>,
    },
  ]

  // Datos de las gráficas de la sesión (issue #3), recalculados con los entrantes.
  const genderData = useMemo(() => toPieData(genderStats(entrants)), [entrants])
  const roleData = useMemo(() => toPieData(roleStats(entrants)), [entrants])
  const careerData = useMemo(() => toBarData(careerStats(entrants), 'Estudiantes'), [entrants])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Historial de Sesiones"
        subtitle="Consulta las sesiones por rango de fechas, sus entrantes y el menú del día"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            loading={sessionsLoading}
            onClick={loadSessions}
          >
            Actualizar
          </Button>
        }
      />

      <Card variant="outlined" padding="md">
        <div className="flex flex-wrap gap-6">
          <DateInput label="Desde" value={dateFrom} onChange={setDateFrom} maxDate={dateTo || undefined} className="w-full sm:w-48" />
          <DateInput label="Hasta" value={dateTo} onChange={setDateTo} minDate={dateFrom || undefined} className="w-full sm:w-48" />
        </div>
      </Card>

      {sessionsError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sessionsError}</div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:items-start">
        {/* Historial de sesiones */}
        <div className="min-w-0 space-y-2">
          <h2 className="text-[15px] font-bold text-black">Sesiones</h2>
          {sessionsLoading ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Cargando sesiones...
            </div>
          ) : (
            <Table<LunchSession>
              columns={sessionColumns}
              rows={sessions}
              keyField="id"
              emptyMessage="No hay sesiones en el rango seleccionado."
              onRowClick={selectSession}
            />
          )}
        </div>

        {/* Detalle de la sesión seleccionada */}
        <div className="min-w-0 space-y-4">
          {!selected ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-400">
              Selecciona una sesión para ver sus entrantes y el menú del día.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[15px] font-bold text-black">
                  Entrantes · {formatDate(selected.date)}
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    options={ROLE_FILTER_OPTIONS}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full sm:w-44"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={onlyAccesoDirecto}
                      onChange={(e) => toggleOnlyAccesoDirecto(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Solo acceso directo
                  </label>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<BarChart3 size={14} />}
                    disabled={entrants.length === 0}
                    onClick={() => setChartsOpen(true)}
                  >
                    Ver gráficas
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Download size={14} />}
                    loading={downloading}
                    disabled={filteredEntrants.length === 0}
                    onClick={handleDownloadPdf}
                  >
                    Descargar PDF
                  </Button>
                </div>
              </div>

              {entrantsError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{entrantsError}</div>
              )}

              {entrantsLoading ? (
                <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                  Cargando entrantes...
                </div>
              ) : (
                <Table<Consumption>
                  columns={entrantColumns}
                  rows={filteredEntrants}
                  keyField="id"
                  emptyMessage={
                    roleFilter !== 'ALL'
                      ? 'No hay entrantes con el rol seleccionado en esta sesión.'
                      : onlyAccesoDirecto
                        ? 'No hay entrantes de acceso directo en esta sesión.'
                        : 'No hay entrantes en esta sesión.'
                  }
                />
              )}

              {/* Menú / consumo del día (#14) */}
              <Card variant="outlined" padding="md">
                <div className="mb-2 flex items-center gap-2">
                  <Utensils size={18} className="text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900">Menú del día</h3>
                </div>
                {menuLoading ? (
                  <p className="text-sm text-slate-500">Cargando menú...</p>
                ) : !menu ? (
                  <p className="text-sm text-slate-500">No hay menú registrado para este día.</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-slate-800">
                      {menu.name}{' '}
                      <span className="font-normal text-slate-500">· {menu.platesQuantity} platos</span>
                    </p>
                    {menu.ingredients.length === 0 ? (
                      <p className="text-slate-500">Sin ingredientes registrados.</p>
                    ) : (
                      <ul className="list-disc space-y-0.5 pl-5 text-slate-600">
                        {menu.ingredients.map((ing) => (
                          <li key={ing.id}>
                            {ing.inventoryItem?.name ?? `Insumo #${ing.inventoryItemId}`}: {ing.calculatedQuantity} {ing.unit}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Modal de gráficas de la sesión (#3) */}
      <Modal
        open={chartsOpen}
        onClose={() => setChartsOpen(false)}
        title={selected ? `Gráficas · ${formatDate(selected.date)}` : 'Gráficas de la sesión'}
        size="lg"
        footer={
          <Button variant="primary" onClick={() => setChartsOpen(false)}>
            Cerrar
          </Button>
        }
      >
        <div className="flex flex-col gap-8">
          <p className="text-sm text-slate-500">
            Distribución de los {entrants.length} entrantes de la sesión.
          </p>

          <div>
            <PieChart
              data={pieData(genderStats(entrants).labels, genderStats(entrants).data)}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' },
                  title: { display: true, text: 'Por género', color: '#1e293b', font: { weight: 'bold' } },
                },
              }}
            />
          </div>

          <div>
            <BarChart
              data={{
                labels: careerStats(entrants).labels,
                datasets: [
                  {
                    label: 'Estudiantes',
                    data: careerStats(entrants).data,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: 'Por carrera (solo estudiantes)', color: '#1e293b', font: { weight: 'bold' } },
                },
                scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
              }}
            />
          </div>

          <div>
            <PieChart
              data={pieData(roleStats(entrants).labels, roleStats(entrants).data)}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'bottom' },
                  title: { display: true, text: 'Por rol', color: '#1e293b', font: { weight: 'bold' } },
                },
              }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
