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
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { Table, type ColumnDef, type RowKey } from '../components/ui/Table'

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
  // de una en una a ciegas no es un flujo, es una lotería. Arranca **activo**: quien
  // entra al padrón entra a clasificar, y así lo recién guardado desaparece de la vista.
  const [onlyUnassigned, setOnlyUnassigned] = useState(true)

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

  // ── Clasificación masiva ───────────────────────────────────────────
  // `pending` es la única fuente del "hay cambios sin guardar": id → sexo elegido.
  const [pending, setPending] = useState<Map<number, StudentGender | null>>(new Map())
  const [selectedIds, setSelectedIds] = useState<RowKey[]>([])
  const [savingBulk, setSavingBulk] = useState(false)
  // Acción aplazada mientras se confirma el descarte de los cambios pendientes.
  const [confirmLeave, setConfirmLeave] = useState<(() => void) | null>(null)

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
        // El servidor resuelve el filtro de sexo, de modo que `total` es el conteo
        // real de lo que falta por clasificar y no el de la página en pantalla.
        gender:    onlyUnassigned ? 'none' : undefined,
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
  }, [page, search, activeState, codCarr, onlyUnassigned])

  useEffect(() => { void refetch() }, [refetch])

  // Cualquier cambio de filtro devuelve a la primera página: mantener el número de
  // página al estrechar el resultado deja al operador mirando una página vacía.
  // Y si hay clasificaciones sin guardar, se pide confirmación antes: perder veinte
  // filas hechas a mano en silencio sería peor que no tener la función.
  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => guardPending(() => { setter(value); setPage(0) })
  }

  /** Ejecuta `action`, pidiendo confirmación si hay cambios sin guardar. */
  function guardPending(action: () => void) {
    if (pending.size === 0) {
      action()
      return
    }
    setConfirmLeave(() => action)
  }

  function discardPending() {
    setPending(new Map())
    setSelectedIds([])
  }

  /**
   * Asigna el sexo de una fila. No guarda: deja el valor pendiente y **marca la
   * casilla**, porque elegir el sexo ya es la declaración de intención y exigir
   * además una marca solo produciría trabajo perdido.
   */
  function setPendingGender(id: number, gender: StudentGender) {
    setPending((prev) => {
      const next = new Map(prev)
      next.set(id, gender)
      return next
    })
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  /** Desmarcar una fila descarta su valor pendiente. */
  function handleSelectionChange(keys: RowKey[]) {
    const kept = new Set(keys)
    setSelectedIds(keys)
    setPending((prev) => {
      const next = new Map<number, StudentGender | null>()
      prev.forEach((value, id) => { if (kept.has(id)) next.set(id, value) })
      return next
    })
  }

  async function handleBulkSave() {
    if (pending.size === 0 || savingBulk) return
    const items = [...pending].map(([id, gender]) => ({ id, gender }))
    setSavingBulk(true)
    try {
      const result = await externalStudentApi.bulkSetGender(items)
      // El número que importa es el de filas realmente cambiadas, no el de enviadas.
      notify.success(
        `${result.updated} estudiante${result.updated !== 1 ? 's' : ''} clasificado${result.updated !== 1 ? 's' : ''}.`,
      )
      if (result.failed > 0) {
        // Un lote parcialmente aplicado anunciado como éxito es peor que un error.
        const failedIds = result.results
          .filter((r) => r.status === 'error')
          .map((r) => String(r.id))
          .join(', ')
        notify.error(`No se pudieron clasificar ${result.failed} (ids: ${failedIds}).`)
      }
      discardPending()
      await refetch()
    } catch (err) {
      // Se conservan los cambios pendientes: reintentar no debe costar volver a
      // clasificar a mano todo lo que ya se había mirado.
      notify.error(err)
    } finally {
      setSavingBulk(false)
    }
  }

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
      render: (_, row) => {
        const isPending = pending.has(row.id)
        const value = isPending ? pending.get(row.id) : row.gender
        return (
          // Dos botones y no un `Select`: dos opciones no justifican un desplegable
          // y el objetivo es un clic por fila. `stopPropagation` para no abrir la
          // ficha al clasificar desde el listado.
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            {(['M', 'F'] as StudentGender[]).map((option) => {
              const active = value === option
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${GENDER_LABEL[option]} para ${row.full_name}`}
                  onClick={() => setPendingGender(row.id, option)}
                  className={[
                    'h-7 w-7 rounded border text-xs font-semibold transition-colors',
                    active
                      ? isPending
                        ? 'border-amber-400 bg-amber-100 text-amber-800'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600',
                  ].join(' ')}
                >
                  {option}
                </button>
              )
            })}
            {isPending && (
              <span className="ml-1 text-xs font-medium text-amber-700">sin guardar</span>
            )}
          </div>
        )
      },
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

      {/* `confirm()` está prohibido en el proyecto: falla en silencio dentro del
          webview de Tauri, y `nativeDialogs.guard.test.ts` lo vigila. */}
      <Modal
        open={confirmLeave !== null}
        onClose={() => setConfirmLeave(null)}
        title="Tienes cambios sin guardar"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                const action = confirmLeave
                setConfirmLeave(null)
                discardPending()
                action?.()
              }}
            >
              Descartar y continuar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Tienes {pending.size} clasificación{pending.size !== 1 ? 'es' : ''} sin guardar.
          Si continúas se perderá{pending.size !== 1 ? 'n' : ''}.
        </p>
      </Modal>

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
            onChange={(e) => resetPage(setOnlyUnassigned)(e.target.checked)}
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
            rows={rows}
            keyField="id"
            loading={loading}
            onRowClick={(row) => setSelected(row)}
            selectedKeys={selectedIds}
            onSelectionChange={handleSelectionChange}
            selectionLabel={(row) => row.full_name}
            emptyMessage={
              onlyUnassigned
                ? 'No queda ningún estudiante sin sexo asignado.'
                : 'No hay estudiantes para los filtros seleccionados.'
            }
          />

          {pending.size > 0 && (
            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm">
              <span className="text-sm font-medium text-amber-900">
                {pending.size} cambio{pending.size !== 1 ? 's' : ''} pendiente
                {pending.size !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                {/* Descartar no pregunta: es la acción reversible —basta volver a
                    marcarlos—, mientras que guardar no lo es. */}
                <Button variant="ghost" size="sm" disabled={savingBulk} onClick={discardPending}>
                  Descartar
                </Button>
                <Button variant="primary" size="sm" loading={savingBulk} onClick={handleBulkSave}>
                  Guardar
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
            <span>
              {total === 0
                ? 'Sin resultados'
                : `Mostrando ${from}–${to} de ${total} estudiante${total !== 1 ? 's' : ''}`}
              {onlyUnassigned && total > 0 && (
                <span className="text-xs text-slate-400">
                  {' '}· pendientes de clasificar
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<ChevronLeft size={15} />}
                disabled={page === 0 || loading}
                onClick={() => guardPending(() => setPage((p) => Math.max(0, p - 1)))}
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ChevronRight size={15} />}
                disabled={page >= lastPage || loading}
                onClick={() => guardPending(() => setPage((p) => p + 1))}
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
