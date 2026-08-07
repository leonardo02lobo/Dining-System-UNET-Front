import { useMemo, useRef, useState } from 'react'
import { Upload, FileUp, CheckCircle2, AlertTriangle, RotateCcw, Info, UserMinus } from 'lucide-react'
import { externalStudentApi } from '../api/externalStudent'
import type { StudentBulkItem, StudentBulkResult, StudentMissingItem } from '../types/student'
import {
  parseCsv,
  decodeCsvBuffer,
  detectDelimiter,
  autoMapColumns,
  buildBulkItems,
  validateRow,
  chunk,
  ENCODING_LABEL,
  SINGLE_FIELDS,
  NAME_PART_FIELDS,
  TARGET_FIELD_LABEL,
  type ColumnMapping,
  type SingleField,
  type CsvEncoding,
  type RowValidation,
} from '../utils/csvImport'
import { mergeRosterFiles, type RosterConflict } from '../utils/rosterMerge'
import { notify } from '../utils/toast'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'

/** Filas por página en la vista previa: con 8.000+ filas no se pueden pintar todas. */
const PREVIEW_PAGE_SIZE = 50
/** Tamaño del lote enviado a `POST /students/bulk`. */
const CHUNK_SIZE = 500

interface LoadedFile {
  name: string
  encoding: CsvEncoding
  delimiter: string
  headers: string[]
  rows: string[][]
  mapping: ColumnMapping
}

/** Acumula los resultados parciales de cada lote en un único resumen. */
function mergeResults(parts: StudentBulkResult[]): StudentBulkResult {
  return parts.reduce<StudentBulkResult>(
    (acc, r) => ({
      total:     acc.total + r.total,
      created:   acc.created + r.created,
      updated:   acc.updated + r.updated,
      unchanged: acc.unchanged + r.unchanged,
      failed:    acc.failed + r.failed,
      results:   [...acc.results, ...r.results],
    }),
    { total: 0, created: 0, updated: 0, unchanged: 0, failed: 0, results: [] },
  )
}

export function StudentImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<LoadedFile[]>([])
  const [parseError, setParseError] = useState<string>('')
  const [showMapping, setShowMapping] = useState(false)
  const [page, setPage] = useState(0)

  const [submitting, setSubmitting] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<StudentBulkResult | null>(null)

  const [missing, setMissing] = useState<StudentMissingItem[]>([])
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  /** Limpia el área de trabajo (archivos y mapeo) sin tocar el resultado. */
  function clearWorkingData() {
    setFiles([])
    setParseError('')
    setPage(0)
    setShowMapping(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function resetAll() {
    clearWorkingData()
    setResult(null)
    setMissing([])
  }

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (selected.length === 0) return
    setResult(null)
    setMissing([])
    setParseError('')
    setPage(0)

    const loaded: LoadedFile[] = []
    const failures: string[] = []

    for (const file of selected) {
      try {
        // `readAsText` asume UTF-8; el padrón oficial llega en UTF-32BE, así que
        // hay que leer los bytes y detectar el encoding a mano.
        const buffer = await file.arrayBuffer()
        const { text, encoding } = decodeCsvBuffer(buffer)
        const delimiter = detectDelimiter(text)
        const parsed = parseCsv(text, delimiter)
        if (parsed.headers.length === 0) {
          failures.push(`${file.name}: no contiene columnas legibles`)
          continue
        }
        loaded.push({
          name: file.name,
          encoding,
          delimiter,
          headers: parsed.headers,
          rows: parsed.rows,
          mapping: autoMapColumns(parsed.headers),
        })
      } catch {
        failures.push(`${file.name}: no se pudo leer`)
      }
    }

    setFiles(loaded)
    setParseError(failures.join(' · '))
  }

  /** Filas de todos los archivos, ya mapeadas, con el estado crudo para validar. */
  const perFileItems = useMemo(
    () => files.map((f) => ({
      name: f.name,
      items: buildBulkItems(f.rows, f.mapping),
      rawActive: f.rows.map((r) =>
        f.mapping.is_active === null ? undefined : (r[f.mapping.is_active] ?? '')),
    })),
    [files],
  )

  const merge = useMemo(
    () => mergeRosterFiles(perFileItems.map((f) => ({ name: f.name, items: f.items }))),
    [perFileItems],
  )

  // El estado crudo se indexa por cédula para poder avisar tras la fusión.
  const rawActiveByCedula = useMemo(() => {
    const map = new Map<string, string | undefined>()
    for (const f of perFileItems) {
      f.items.forEach((item, i) => map.set(item.cedula, f.rawActive[i]))
    }
    return map
  }, [perFileItems])

  const validations = useMemo<RowValidation[]>(
    () => merge.merged.map((item) => validateRow(item, rawActiveByCedula.get(item.cedula))),
    [merge.merged, rawActiveByCedula],
  )

  const validItems = useMemo(
    () => merge.merged.filter((_, i) => validations[i].valid),
    [merge.merged, validations],
  )
  const invalidRows = useMemo(
    () => merge.merged
      .map((item, i) => ({ item, v: validations[i], index: i }))
      .filter((r) => !r.v.valid),
    [merge.merged, validations],
  )
  const warningCount = validations.filter((v) => v.warnings.length > 0).length

  const totalRows = files.reduce((n, f) => n + f.rows.length, 0)
  const hasData = files.length > 0
  const pageCount = Math.max(1, Math.ceil(merge.merged.length / PREVIEW_PAGE_SIZE))
  const pageItems = merge.merged.slice(page * PREVIEW_PAGE_SIZE, (page + 1) * PREVIEW_PAGE_SIZE)

  function setFieldColumn(fileIndex: number, field: SingleField, value: string) {
    setFiles((prev) => prev.map((f, i) =>
      i === fileIndex ? { ...f, mapping: { ...f.mapping, [field]: value === '' ? null : Number(value) } } : f,
    ))
  }

  function columnOptions(headers: string[]) {
    return [
      { value: '', label: '— Sin asignar —' },
      ...headers.map((h, i) => ({ value: String(i), label: h || `Columna ${i + 1}` })),
    ]
  }

  async function handleSubmit() {
    if (validItems.length === 0) {
      notify.info('No hay filas válidas para importar.')
      return
    }
    setSubmitting(true)
    const batches = chunk(validItems, CHUNK_SIZE)
    setProgress({ done: 0, total: batches.length })

    const parts: StudentBulkResult[] = []
    const failedBatches: number[] = []

    // Secuencial a propósito: en paralelo, 17 lotes de 500 filas saturan la BD.
    for (const [i, batch] of batches.entries()) {
      try {
        parts.push(await externalStudentApi.bulkCreate(batch))
      } catch {
        // Un lote caído no debe abortar la carga: se reporta y se sigue.
        failedBatches.push(i + 1)
      }
      setProgress({ done: i + 1, total: batches.length })
    }

    const combined = mergeResults(parts)
    setResult(combined)

    // Reconciliación semestral: quién sigue activo en el padrón y no vino aquí.
    try {
      const check = await externalStudentApi.missingCheck(validItems.map((i) => i.cedula))
      setMissing(check.items)
    } catch {
      // Informativo: que falle no invalida la importación ya hecha.
      setMissing([])
    }

    clearWorkingData()
    setSubmitting(false)
    setProgress(null)

    if (failedBatches.length > 0) {
      notify.error(
        `Importación parcial: fallaron ${failedBatches.length} de ${batches.length} lotes ` +
        `(${failedBatches.join(', ')}). Vuelve a cargar el archivo para reintentarlos.`,
      )
    } else {
      notify.success(
        `Importación completada: ${combined.created} creado(s), ${combined.updated} actualizado(s), ` +
        `${combined.unchanged} sin cambios, ${combined.failed} con error.`,
      )
    }
  }

  /** Marca como inactivos a los estudiantes ausentes de la carga. */
  async function handleDeactivateMissing() {
    setDeactivating(true)
    try {
      const items: StudentBulkItem[] = missing.map((s) => ({
        full_name: s.full_name,
        cedula:    s.cedula,
        email:     null,
        career:    s.career,
        is_active: false,
      }))
      for (const batch of chunk(items, CHUNK_SIZE)) {
        await externalStudentApi.bulkCreate(batch)
      }
      notify.success(`${missing.length} estudiante(s) marcados como inactivos.`)
      setMissing([])
    } catch (err) {
      notify.error(err)
    } finally {
      setDeactivating(false)
      setConfirmDeactivate(false)
    }
  }

  return (
    <div>
      <PageHeader
        breadcrumb="Estudiantes"
        title="Importar Estudiantes (CSV)"
        subtitle="Carga del padrón oficial de la UNET. Puedes seleccionar Activos.csv e Inactivos.csv a la vez."
      />

      <div className="flex flex-col gap-4">
        {/* Paso 1: subir archivos */}
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileUp size={18} className="text-blue-600" />
              1. Selecciona los archivos CSV
            </div>
            <p className="text-xs text-slate-500">
              Se detectan automáticamente la codificación (UTF-8, UTF-16 o UTF-32) y el separador
              (coma o punto y coma). La columna de estado admite <code>A</code>/<code>I</code>,
              activo/inactivo, sí/no, 1/0.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,text/csv"
                onChange={handleFiles}
                className="block text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              />
              {(hasData || result) && (
                <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={14} />} onClick={resetAll}>
                  Reiniciar
                </Button>
              )}
            </div>

            {files.length > 0 && (
              <ul className="flex flex-col gap-1 text-xs text-slate-600">
                {files.map((f) => (
                  <li key={f.name} className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-slate-700">{f.name}</span>
                    <Badge variant="neutral">{ENCODING_LABEL[f.encoding]}</Badge>
                    <Badge variant="neutral">separador «{f.delimiter}»</Badge>
                    <span>{f.rows.length} fila{f.rows.length !== 1 ? 's' : ''}</span>
                  </li>
                ))}
              </ul>
            )}

            {parseError && (
              <p className="text-xs text-red-600" role="alert">{parseError}</p>
            )}
          </div>
        </Card>

        {/* Paso 2: mapeo (colapsado — el auto-mapeo acierta con la cabecera oficial) */}
        {hasData && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-700">2. Asignación de columnas</div>
                <Button variant="ghost" size="sm" onClick={() => setShowMapping((v) => !v)}>
                  {showMapping ? 'Ocultar' : 'Revisar / ajustar'}
                </Button>
              </div>
              {!showMapping && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Info size={14} className="text-blue-600" />
                  Las columnas se asignaron automáticamente. Ábrelo solo si algún campo salió mal.
                </p>
              )}
              {showMapping && files.map((f, fileIndex) => (
                <div key={f.name} className="flex flex-col gap-2 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
                  <div className="text-xs font-medium text-slate-600">{f.name}</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SINGLE_FIELDS.map((field) => (
                      <Select
                        key={field}
                        label={TARGET_FIELD_LABEL[field]}
                        options={columnOptions(f.headers)}
                        value={f.mapping[field] === null ? '' : String(f.mapping[field])}
                        onChange={(e) => setFieldColumn(fileIndex, field, e.target.value)}
                        fullWidth
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    El nombre completo se arma con{' '}
                    {NAME_PART_FIELDS.map((n) => TARGET_FIELD_LABEL[n]).join(' + ')}.
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Paso 3: fusión y vista previa */}
        {hasData && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-700">3. Vista previa</div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">{files.length} archivo(s) · {totalRows} fila(s)</Badge>
                  <Badge variant="success">{validItems.length} válida(s)</Badge>
                  {invalidRows.length > 0 && <Badge variant="danger">{invalidRows.length} inválida(s)</Badge>}
                  {merge.duplicates > 0 && (
                    <Badge variant="info">{merge.duplicates} duplicado(s) resuelto(s)</Badge>
                  )}
                  {warningCount > 0 && <Badge variant="warning">{warningCount} con aviso</Badge>}
                </div>
              </div>

              {merge.conflicts.length > 0 && (
                <ConflictNotice conflicts={merge.conflicts} />
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Nombre completo</th>
                      <th className="px-2 py-2">Correo</th>
                      <th className="px-2 py-2">Carrera</th>
                      <th className="px-2 py-2">Cód.</th>
                      <th className="px-2 py-2">Cédula</th>
                      <th className="px-2 py-2">Nac.</th>
                      <th className="px-2 py-2">Activo</th>
                      <th className="px-2 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, i) => {
                      const globalIndex = page * PREVIEW_PAGE_SIZE + i
                      const v = validations[globalIndex]
                      return (
                        <tr
                          key={`${item.cedula}-${globalIndex}`}
                          className={`border-b border-slate-100 ${v.valid ? '' : 'bg-red-50'}`}
                        >
                          <td className="px-2 py-1.5 text-slate-500">{globalIndex + 1}</td>
                          <td className="px-2 py-1.5 text-slate-800">{item.full_name || <Dash />}</td>
                          <td className="px-2 py-1.5 text-slate-600">{item.email ?? <Dash />}</td>
                          <td className="px-2 py-1.5 text-slate-600">{item.career ?? <Dash />}</td>
                          <td className="px-2 py-1.5 text-slate-500">{item.cod_carr ?? <Dash />}</td>
                          <td className="px-2 py-1.5 text-slate-600">{item.cedula || <Dash />}</td>
                          <td className="px-2 py-1.5 text-slate-500">{item.nacionalidad ?? <Dash />}</td>
                          <td className="px-2 py-1.5">
                            <Badge variant={item.is_active ? 'success' : 'neutral'}>
                              {item.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-2 py-1.5">
                            <RowStatus validation={v} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {pageCount > 1 && (
                <div className="flex items-center justify-end gap-2 text-xs text-slate-600">
                  <Button variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    Anterior
                  </Button>
                  <span>Página {page + 1} de {pageCount}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= pageCount - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              )}

              {invalidRows.length > 0 && (
                <details className="rounded-md border border-red-200 bg-red-50 p-3">
                  <summary className="cursor-pointer text-xs font-medium text-red-700">
                    Ver las {invalidRows.length} fila(s) que no se importarán
                  </summary>
                  <ul className="mt-2 flex flex-col gap-1 text-xs text-red-700">
                    {invalidRows.map(({ item, v, index }) => (
                      <li key={index}>
                        Fila {index + 1} · {item.full_name || 'sin nombre'} ({item.cedula || 'sin cédula'}):{' '}
                        {v.errors.join('; ')}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              <div className="flex flex-wrap items-center justify-end gap-3">
                {progress && (
                  <span className="text-xs text-slate-600">
                    Enviando lote {progress.done} de {progress.total}…
                  </span>
                )}
                <Button
                  variant="primary"
                  leftIcon={<Upload size={15} />}
                  loading={submitting}
                  disabled={validItems.length === 0}
                  onClick={handleSubmit}
                >
                  Importar {validItems.length} estudiante{validItems.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Paso 4: resultado */}
        {result && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold text-slate-700">Resultado de la importación</div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="info">Total: {result.total}</Badge>
                <Badge variant="success">Creados: {result.created}</Badge>
                <Badge variant="info">Actualizados: {result.updated}</Badge>
                <Badge variant="neutral">Sin cambios: {result.unchanged}</Badge>
                <Badge variant={result.failed > 0 ? 'danger' : 'neutral'}>Fallidos: {result.failed}</Badge>
              </div>

              {result.results.some((r) => r.status === 'error') && (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                        <th className="px-2 py-2">Fila</th>
                        <th className="px-2 py-2">Cédula</th>
                        <th className="px-2 py-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.results
                        .filter((r) => r.status === 'error')
                        .map((r, i) => (
                          <tr key={`${r.cedula}-${i}`} className="border-b border-slate-100 bg-red-50">
                            <td className="px-2 py-1.5 text-slate-500">{r.row}</td>
                            <td className="px-2 py-1.5 text-slate-700">{r.cedula}</td>
                            <td className="px-2 py-1.5 text-red-600">{r.error ?? 'Error desconocido'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={14} />} onClick={resetAll}>
                  Importar otro archivo
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Reconciliación semestral */}
        {missing.length > 0 && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                <AlertTriangle size={18} />
                {missing.length} estudiante(s) activos no vienen en esta carga
              </div>
              <p className="text-xs text-slate-600">
                Siguen marcados como activos en el padrón pero no aparecen en los archivos importados
                (posibles graduados o retirados). <strong>No se ha modificado ninguno.</strong> Si
                cargaste solo una parte del padrón, ignora este aviso.
              </p>

              <div className="max-h-64 overflow-y-auto rounded-md border border-slate-200">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="px-2 py-2">Cédula</th>
                      <th className="px-2 py-2">Nombre</th>
                      <th className="px-2 py-2">Carrera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missing.map((s) => (
                      <tr key={s.id} className="border-b border-slate-100">
                        <td className="px-2 py-1.5 text-slate-600">{s.cedula}</td>
                        <td className="px-2 py-1.5 text-slate-800">{s.full_name}</td>
                        <td className="px-2 py-1.5 text-slate-600">{s.career ?? <Dash />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="danger"
                  size="sm"
                  leftIcon={<UserMinus size={15} />}
                  onClick={() => setConfirmDeactivate(true)}
                >
                  Desactivar los {missing.length} ausentes
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Modal
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        title="Desactivar estudiantes ausentes"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDeactivate(false)}>Cancelar</Button>
            <Button variant="danger" loading={deactivating} onClick={handleDeactivateMissing}>
              Desactivar {missing.length}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          Se marcarán como inactivos {missing.length} estudiante(s). Dejarán de poder registrar
          consumo en el comedor hasta que vuelvan a aparecer en una carga del padrón.
        </p>
      </Modal>
    </div>
  )
}

function Dash() {
  return <span className="text-slate-300">—</span>
}

function RowStatus({ validation }: { validation: RowValidation }) {
  if (!validation.valid) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-600" title={validation.errors.join('; ')}>
        <AlertTriangle size={14} /> {validation.errors.join('; ')}
      </span>
    )
  }
  if (validation.warnings.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600" title={validation.warnings.join('; ')}>
        <Info size={14} /> {validation.warnings.join('; ')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <CheckCircle2 size={14} /> OK
    </span>
  )
}

function ConflictNotice({ conflicts }: { conflicts: RosterConflict[] }) {
  return (
    <details className="rounded-md border border-blue-200 bg-blue-50 p-3">
      <summary className="cursor-pointer text-xs font-medium text-blue-800">
        {conflicts.length} cédula(s) aparecen en más de un archivo — se conservó el registro activo
      </summary>
      <ul className="mt-2 flex flex-col gap-1 text-xs text-blue-900">
        {conflicts.map((c) => (
          <li key={c.cedula}>
            <strong>{c.cedula}</strong> · se conserva «{c.kept.career ?? 'sin carrera'}»
            ({c.kept.is_active ? 'activo' : 'inactivo'}, {c.keptFrom}); se descarta{' '}
            {c.discarded.map((d) => `«${d.item.career ?? 'sin carrera'}» (${d.from})`).join(', ')}
          </li>
        ))}
      </ul>
    </details>
  )
}
