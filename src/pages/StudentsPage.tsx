import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { externalStudentApi } from '../api/externalStudent'
import { careerApi } from '../api/career'
import type { StudentGender, StudentPadronData } from '../types/student'
import type { Career } from '../types/career'
import { notify } from '../utils/toast'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { Table, type ColumnDef } from '../components/ui/Table'

/** Tamaño de página del padrón. El backend admite hasta 500 por petición. */
const PAGE_SIZE = 50

/** Marcador de un dato del padrón que el CSV oficial no trajo. */
const EMPTY = '—'

const GENDER_LABEL: Record<StudentGender, string> = {
  M: 'Masculino',
  F: 'Femenino',
}

/** Etiqueta del sexo con el tercer estado explícito: nulo es *sin clasificar*. */
function genderLabel(gender: StudentGender | null | undefined): string {
  return gender ? GENDER_LABEL[gender] : 'Sin clasificar'
}

/** Campo de solo lectura de la ficha. No hay control de edición a propósito. */
function ReadOnlyRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
      <span className="text-xs uppercase tracking-wide text-slate-500 sm:w-44 sm:flex-shrink-0">
        {label}
      </span>
      <span className="break-words text-sm text-slate-800">{value}</span>
    </div>
  )
}

/** Sección con título de la ficha (Identificación · Datos académicos · …). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-sm font-semibold text-blue-600">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  )
}

/**
 * Padrón de Estudiantes. Consulta del padrón importado desde el CSV de Control de
 * Estudios y única pantalla donde se clasifica el sexo, el dato que el archivo
 * oficial no trae y que las estadísticas de género necesitan.
 *
 * Todo lo demás es de solo lectura por diseño: el resto de los campos llegan del CSV
 * y se corrigen reimportando, no a mano (el `PATCH` del backend rechaza con 422
 * cualquier campo que no sea `gender`, así que la restricción no vive solo aquí).
 */
export function StudentsPage() {
  // ── Filtros ────────────────────────────────────────────────────────
  const [search,      setSearch]      = useState('')
  const [activeState, setActiveState] = useState<'all' | 'true' | 'false'>('all')
  const [codCarr,     setCodCarr]     = useState('')
  // Cola de trabajo de clasificación: con 8.380 filas importadas sin sexo, buscarlas
  // de una en una a ciegas no es un flujo, es una lotería.
  const [onlyUnassigned, setOnlyUnassigned] = useState(false)

  // ── Listado ────────────────────────────────────────────────────────
  const [rows,    setRows]    = useState<StudentPadronData[]>([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(0)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const [careers, setCareers] = useState<Career[]>([])

  // ── Ficha seleccionada ─────────────────────────────────────────────
  const [selected, setSelected] = useState<StudentPadronData | null>(null)
  const [savingGender, setSavingGender] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        setCareers(await careerApi.list())
      } catch {
        // El catálogo solo alimenta un filtro: si falla, la pantalla sigue siendo útil.
      }
    })()
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const result = await externalStudentApi.list({
        skip:      page * PAGE_SIZE,
        limit:     PAGE_SIZE,
        search:    search.trim() || undefined,
        is_active: activeState === 'all' ? undefined : activeState === 'true',
        cod_carr:  codCarr || undefined,
      })
      setRows(result.items)
      setTotal(result.total)
      setError(null)
    } catch (err: any) {
      // La pantalla no revienta si la API todavía no responde: se queda vacía con
      // el motivo a la vista, como el resto de listados del panel.
      setRows([])
      setTotal(0)
      setError(err?.message ?? 'Error al cargar el padrón de estudiantes')
    } finally {
      setLoading(false)
    }
  }, [page, search, activeState, codCarr])

  useEffect(() => { void refetch() }, [refetch])

  // Cualquier cambio de filtro devuelve a la primera página: mantener el número de
  // página al estrechar el resultado deja al operador mirando una página vacía.
  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => { setter(value); setPage(0) }
  }

  /**
   * El filtro "Sin sexo asignado" se aplica sobre la página cargada: el contrato del
   * backend no expone un parámetro de sexo en `GET /students`, y no se inventa uno
   * aquí porque el otro lado no lo implementaría. Mientras el padrón esté sin
   * clasificar —que es el estado de partida— toda la página cae dentro del filtro.
   */
  const visibleRows = useMemo(
    () => (onlyUnassigned ? rows.filter((s) => s.gender == null) : rows),
    [rows, onlyUnassigned],
  )

  const careerOptions = useMemo(
    () => [
      { value: '', label: 'Todas las carreras' },
      ...careers
        .filter((c) => c.code)
        .map((c) => ({ value: c.code as string, label: c.name })),
    ],
    [careers],
  )

  const stateOptions = [
    { value: 'all',   label: 'Todos los estados' },
    { value: 'true',  label: 'Activo en el padrón'   },
    { value: 'false', label: 'Inactivo en el padrón' },
  ]

  /**
   * Clasifica el sexo. `null` devuelve al estado sin clasificar: una clasificación
   * equivocada tiene que poder deshacerse, o el filtro de la cola de trabajo se
   * llenaría de errores irreversibles.
   */
  async function handleGenderChange(next: StudentGender | null) {
    if (!selected || savingGender) return
    setSavingGender(true)
    try {
      const updated = await externalStudentApi.setGender(selected.id, next)
      setSelected(updated)
      // El listado refleja el cambio sin recargar la página completa.
      setRows((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
      notify.success(
        next === null
          ? `${updated.full_name} vuelve a estar sin clasificar.`
          : `${updated.full_name}: ${GENDER_LABEL[next]}.`,
      )
    } catch (err) {
      notify.error(err)
    } finally {
      setSavingGender(false)
    }
  }

  const columns: ColumnDef<StudentPadronData>[] = [
    {
      key: 'cedula',
      header: 'Cédula',
      render: (_, row) => <span className="font-medium text-slate-800">{row.cedula}</span>,
    },
    {
      key: 'full_name',
      header: 'Nombre',
      render: (_, row) => <span className="text-slate-700">{row.full_name}</span>,
    },
    {
      key: 'career',
      header: 'Carrera',
      render: (_, row) => <span className="text-slate-500">{row.career ?? EMPTY}</span>,
    },
    {
      key: 'gender',
      header: 'Sexo',
      render: (_, row) => (
        <Badge variant={row.gender ? 'info' : 'neutral'}>{genderLabel(row.gender)}</Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Estado',
      render: (_, row) => (
        <Badge variant={row.is_active ? 'success' : 'danger'}>
          {row.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1)

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Padrón de Estudiantes"
        subtitle="Consulta el padrón importado y clasifica el sexo de cada estudiante"
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ── Filtros ──────────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput
          placeholder="Buscar por cédula o nombre..."
          className="w-full sm:w-72"
          onSearch={resetPage(setSearch)}
          debounceMs={300}
        />
        <Select
          label="Estado en el padrón"
          options={stateOptions}
          value={activeState}
          onChange={(e) => resetPage(setActiveState)(e.target.value as 'all' | 'true' | 'false')}
          className="w-full sm:w-52"
        />
        <Select
          label="Carrera"
          options={careerOptions}
          value={codCarr}
          onChange={(e) => resetPage(setCodCarr)(e.target.value)}
          className="w-full sm:w-64"
        />
        <label className="flex h-11 items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={onlyUnassigned}
            onChange={(e) => setOnlyUnassigned(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Sin sexo asignado
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* ── Listado ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 lg:col-span-3">
          <Table<StudentPadronData>
            columns={columns}
            rows={visibleRows}
            keyField="id"
            loading={loading}
            onRowClick={(row) => setSelected(row)}
            emptyMessage={
              onlyUnassigned
                ? 'No queda ningún estudiante sin sexo asignado en esta página.'
                : 'No hay estudiantes para los filtros seleccionados.'
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <span>
              {total === 0
                ? 'Sin resultados'
                : `Mostrando ${from}–${to} de ${total} estudiante${total !== 1 ? 's' : ''}`}
              {onlyUnassigned && total > 0 && (
                <span className="text-xs text-slate-400">
                  {' '}· filtro de sexo aplicado sobre esta página
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ChevronLeft size={15} />}
                disabled={page === 0 || loading}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ChevronRight size={15} />}
                disabled={page >= lastPage || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>

        {/* ── Ficha del estudiante seleccionado ──────────────────── */}
        <Card variant="outlined" padding="md" className="lg:col-span-2">
          {!selected ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Selecciona un estudiante del listado para ver su ficha.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">{selected.full_name}</p>
                <p className="text-xs text-slate-500">C.I. {selected.cedula}</p>
              </div>

              <Section title="Identificación">
                <ReadOnlyRow label="Nacionalidad" value={selected.nacionalidad ?? EMPTY} />
                <ReadOnlyRow label="Cédula" value={selected.cedula} />
                <ReadOnlyRow label="Documento original" value={selected.cedula_raw ?? EMPTY} />
                <ReadOnlyRow label="Primer nombre" value={selected.p_nombre ?? EMPTY} />
                <ReadOnlyRow label="Segundo nombre" value={selected.s_nombre ?? EMPTY} />
                <ReadOnlyRow label="Primer apellido" value={selected.p_apellido ?? EMPTY} />
                <ReadOnlyRow label="Segundo apellido" value={selected.s_apellido ?? EMPTY} />
              </Section>

              <Section title="Datos académicos">
                <ReadOnlyRow label="Código de carrera" value={selected.cod_carr ?? EMPTY} />
                <ReadOnlyRow label="Carrera" value={selected.career ?? EMPTY} />
              </Section>

              <Section title="Contacto">
                <ReadOnlyRow label="Correo" value={selected.email ?? EMPTY} />
              </Section>

              <Section title="Estado">
                <ReadOnlyRow
                  label="Estado en el padrón"
                  value={
                    <Badge variant={selected.is_active ? 'success' : 'danger'}>
                      {selected.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  }
                />
              </Section>

              <Section title="Sexo">
                {/* Dos opciones excluyentes sobre un estado inicial vacío, no una
                    casilla: el dominio tiene tres estados y una casilla sin marcar
                    sería indistinguible de "femenino", así que no habría forma de
                    saber cuántos faltan por revisar. */}
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Sexo">
                  {(['M', 'F'] as const).map((value) => {
                    const isSelected = selected.gender === value
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={savingGender}
                        onClick={() => void handleGenderChange(value)}
                        className={[
                          'rounded-md border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50',
                        ].join(' ')}
                      >
                        {GENDER_LABEL[value]}
                      </button>
                    )
                  })}
                  {savingGender && <Spinner size="sm" />}
                </div>

                <p className="text-xs text-slate-500">
                  Estado actual: <strong>{genderLabel(selected.gender)}</strong>
                </p>

                {/* Volver al estado sin clasificar: una clasificación equivocada
                    tiene que poder deshacerse. */}
                {selected.gender != null && (
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={savingGender}
                      onClick={() => void handleGenderChange(null)}
                    >
                      Dejar sin clasificar
                    </Button>
                  </div>
                )}
              </Section>

              <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">
                El resto de los datos proviene del CSV oficial de Control de Estudios y solo
                se corrige reimportando el padrón.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
