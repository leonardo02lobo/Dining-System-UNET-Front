import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileUp, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'
import { accesoDirectoApi } from '../api/acceso_directo'
import type { AccesoDirectoBulkResult } from '../types/acceso_directo'
import {
  parseCsv,
  autoMapColumns,
  buildBulkItems,
  validateRow,
  TARGET_FIELDS,
  TARGET_FIELD_LABEL,
  type ColumnMapping,
  type TargetField,
} from '../utils/csvImport'
import { notify } from '../utils/toast'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Select } from '../components/ui/Select'

const ACCEPTED_ACTIVE_VALUES =
  'Activo se interpreta de forma tolerante: verdadero → true, 1, si/sí, activo, x, yes · falso → false, 0, no, inactivo, vacío.'

export function AccesoDirectoImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [parseError, setParseError] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AccesoDirectoBulkResult | null>(null)

  /** Limpia el área de trabajo (archivo, mapeo y vista previa) sin tocar el resultado. */
  function clearWorkingData() {
    setFileName('')
    setHeaders([])
    setRows([])
    setMapping(null)
    setParseError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function resetAll() {
    clearWorkingData()
    setResult(null)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setResult(null)
    setParseError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '')
        const parsed = parseCsv(text)
        if (parsed.headers.length === 0) {
          setParseError('El archivo no contiene columnas legibles.')
          return
        }
        setFileName(file.name)
        setHeaders(parsed.headers)
        setRows(parsed.rows)
        setMapping(autoMapColumns(parsed.headers))
      } catch {
        setParseError('No se pudo leer el archivo CSV.')
      }
    }
    reader.onerror = () => setParseError('No se pudo leer el archivo CSV.')
    reader.readAsText(file)
  }

  const items = useMemo(
    () => (mapping ? buildBulkItems(rows, mapping) : []),
    [rows, mapping],
  )

  const validations = useMemo(() => items.map(validateRow), [items])
  const validCount = validations.filter((v) => v.valid).length
  const invalidCount = validations.length - validCount

  const columnOptions = useMemo(
    () => [
      { value: '', label: '— Sin asignar —' },
      ...headers.map((h, i) => ({ value: String(i), label: h || `Columna ${i + 1}` })),
    ],
    [headers],
  )

  function setFieldColumn(field: TargetField, value: string) {
    if (!mapping) return
    setMapping({ ...mapping, [field]: value === '' ? null : Number(value) })
  }

  async function handleSubmit() {
    const validItems = items.filter((_, i) => validations[i].valid)
    if (validItems.length === 0) {
      notify.info('No hay filas válidas para importar.')
      return
    }
    setSubmitting(true)
    try {
      const res = await accesoDirectoApi.bulkCreate(validItems)
      setResult(res)
      // Importación terminada: se limpia la ventana de carga y queda solo el resumen.
      clearWorkingData()
      notify.success(
        `Importación completada: ${res.created} creado(s), ${res.updated} actualizado(s), ` +
        `${res.unchanged} sin cambios, ${res.failed} con error.`,
      )
    } catch (err) {
      notify.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const hasData = headers.length > 0 && mapping !== null

  return (
    <div>
      <PageHeader
        breadcrumb="Accesos Directos"
        title="Importar Accesos (CSV)"
        subtitle="Carga masiva de accesos directos desde un archivo CSV separado por comas."
        actions={
          <Link
            to="/accesos_directos"
            className="inline-flex h-8 items-center rounded-md border-2 border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
          >
            Ver lista
          </Link>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Paso 1: subir archivo */}
        <Card variant="outlined" padding="lg">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <FileUp size={18} className="text-blue-600" />
              1. Selecciona el archivo CSV
            </div>
            <p className="text-xs text-slate-500">
              El archivo debe estar separado por comas y tener una fila de cabecera. {ACCEPTED_ACTIVE_VALUES}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFile}
                className="block text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              />
              {fileName && (
                <span className="text-xs text-slate-500">
                  {fileName} · {rows.length} fila{rows.length !== 1 ? 's' : ''}
                </span>
              )}
              {(hasData || result) && (
                <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={14} />} onClick={resetAll}>
                  Reiniciar
                </Button>
              )}
            </div>
            {parseError && (
              <p className="text-xs text-red-600" role="alert">{parseError}</p>
            )}
          </div>
        </Card>

        {/* Paso 2: mapeo de columnas */}
        {hasData && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col gap-3">
              <div className="text-sm font-semibold text-slate-700">2. Asigna las columnas</div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TARGET_FIELDS.map((field) => (
                  <Select
                    key={field}
                    label={TARGET_FIELD_LABEL[field]}
                    options={columnOptions}
                    value={mapping[field] === null ? '' : String(mapping[field])}
                    onChange={(e) => setFieldColumn(field, e.target.value)}
                    fullWidth
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Paso 3: vista previa */}
        {hasData && (
          <Card variant="outlined" padding="lg">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-700">3. Vista previa</div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">{validCount} válida(s)</Badge>
                  {invalidCount > 0 && <Badge variant="danger">{invalidCount} inválida(s)</Badge>}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Nombre completo</th>
                      <th className="px-2 py-2">Correo</th>
                      <th className="px-2 py-2">Carrera</th>
                      <th className="px-2 py-2">Cédula</th>
                      <th className="px-2 py-2">Activo</th>
                      <th className="px-2 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const v = validations[i]
                      return (
                        <tr
                          key={i}
                          className={`border-b border-slate-100 ${v.valid ? '' : 'bg-red-50'}`}
                        >
                          <td className="px-2 py-1.5 text-slate-400">{i + 1}</td>
                          <td className="px-2 py-1.5 text-slate-800">{item.full_name || <span className="text-slate-300">—</span>}</td>
                          <td className="px-2 py-1.5 text-slate-600">{item.email ?? <span className="text-slate-300">—</span>}</td>
                          <td className="px-2 py-1.5 text-slate-600">{item.career ?? <span className="text-slate-300">—</span>}</td>
                          <td className="px-2 py-1.5 text-slate-600">{item.document_id || <span className="text-slate-300">—</span>}</td>
                          <td className="px-2 py-1.5">
                            <Badge variant={item.is_active ? 'success' : 'neutral'}>
                              {item.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                          <td className="px-2 py-1.5">
                            {v.valid ? (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle2 size={14} /> OK
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600" title={v.errors.join('; ')}>
                                <AlertTriangle size={14} /> {v.errors.join('; ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  leftIcon={<Upload size={15} />}
                  loading={submitting}
                  disabled={validCount === 0}
                  onClick={handleSubmit}
                >
                  Importar {validCount} acceso{validCount !== 1 ? 's' : ''}
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
                        .map((r) => (
                          <tr key={r.row} className="border-b border-slate-100 bg-red-50">
                            <td className="px-2 py-1.5 text-slate-500">{r.row}</td>
                            <td className="px-2 py-1.5 text-slate-700">{r.document_id}</td>
                            <td className="px-2 py-1.5 text-red-600">{r.error ?? 'Error desconocido'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/accesos_directos"
                  className="inline-flex h-8 items-center rounded-md border-2 border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
                >
                  Ver lista actualizada
                </Link>
                <Button variant="ghost" size="sm" leftIcon={<RotateCcw size={14} />} onClick={resetAll}>
                  Importar otro archivo
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
