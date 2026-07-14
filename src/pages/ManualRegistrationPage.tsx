import { useCallback, useEffect, useState } from 'react'
import { Search, Save, RotateCcw, Printer, Pencil, Trash2 } from 'lucide-react'
import { studentApi, studentToIdentity } from '../api/student'
import { accesoDirectoApi } from '../api/acceso_directo'
import { consumptionApi } from '../api/consumption'
import { normalizeCedula } from '../utils/cedula'
import { errorMessage, CONFLICT } from '../utils/apiErrors'
import { printManualList } from '../utils/printManual'
import type { Student } from '../types/user'
import type { ManualConsumption, ManualOrderBy, OrderDir } from '../types/consumption'
import { notify } from '../utils/toast'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Badge } from '../components/ui/Badge'
import { Spinner } from '../components/ui/Spinner'
import { Table, type ColumnDef } from '../components/ui/Table'
import { StudentResultCard } from '../components/StudentResultCard'
import { userTypeLabel } from '../utils/labels'

/** Fecha local de hoy en formato YYYY-MM-DD (sin desfase de zona horaria). */
function todayISO(): string {
  const d = new Date()
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

export function ManualRegistrationPage() {
  // Fecha obligatoria del registro manual (problemática 23)
  const [date,     setDate]     = useState<string>(todayISO())

  // Búsqueda del estudiante
  const [cedula,   setCedula]   = useState('')
  const [student,  setStudent]  = useState<Student | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Listado de registros manuales (problemáticas 24 y 28)
  const [rows,        setRows]      = useState<ManualConsumption[]>([])
  const [listLoading, setListLoad]  = useState(false)
  const [orderBy,     setOrderBy]   = useState<ManualOrderBy>('document_id')
  const [orderDir,    setOrderDir]  = useState<OrderDir>('asc')

  // Edición (problemática 25)
  const [editTarget, setEditTarget] = useState<ManualConsumption | null>(null)
  const [editDate,   setEditDate]   = useState('')
  const [editCedula, setEditCedula] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Eliminación (problemática 26)
  const [deleteTarget,  setDeleteTarget]  = useState<ManualConsumption | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const refetchList = useCallback(async () => {
    if (!date) return
    setListLoad(true)
    try {
      const result = await consumptionApi.listManual({ date, order_by: orderBy, order_dir: orderDir })
      setRows(result.items)
    } catch (err) {
      notify.error(err)
    } finally {
      setListLoad(false)
    }
  }, [date, orderBy, orderDir])

  useEffect(() => { void refetchList() }, [refetchList])

  async function handleSearch() {
    const clean = normalizeCedula(cedula)
    if (!clean) return
    setCedula(clean)
    setLoading(true)
    setError(null)
    setSearched(true)
    setStudent(null)
    try {
      const data = await studentApi.lookup(clean)
      setStudent(data)
    } catch (err: any) {
      setError(err.message ?? 'Error al consultar el estudiante')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!student || !date) return
    setSaving(true)
    setError(null)
    try {
      // Si no es acceso directo, se envían sus datos para el alta al vuelo (Issue 2).
      await consumptionApi.registerManual(
        student.is_acceso_directo && student.acceso_directo_id
          ? { date, acceso_directo_id: student.acceso_directo_id }
          : { date, person: studentToIdentity(student) },
      )
      notify.success(`Registro manual exitoso para ${student.name}`)
      handleClear()
      await refetchList()
    } catch (err: any) {
      const msg = errorMessage(err, { 409: CONFLICT.manualDuplicate }, 'Error al registrar el consumo')
      notify.error(msg)
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  function handleClear() {
    setCedula('')
    setStudent(null)
    setSearched(false)
    setError(null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') void handleSearch()
  }

  function openEdit(row: ManualConsumption) {
    setEditTarget(row)
    setEditDate(row.date)
    setEditCedula(row.document_id)
  }

  async function confirmEdit() {
    if (!editTarget) return
    const payload: { acceso_directo_id?: number; date?: string } = {}
    if (editDate && editDate !== editTarget.date) payload.date = editDate

    const cleanCedula = normalizeCedula(editCedula)
    if (cleanCedula && cleanCedula !== editTarget.document_id) {
      try {
        const ad = await accesoDirectoApi.lookup(cleanCedula)
        payload.acceso_directo_id = ad.id
      } catch {
        notify.error('No se encontró un acceso directo con esa cédula.')
        return
      }
    }

    if (payload.date === undefined && payload.acceso_directo_id === undefined) {
      setEditTarget(null)
      return
    }

    setEditSaving(true)
    try {
      await consumptionApi.updateManual(editTarget.id, payload)
      notify.success('Registro manual actualizado.')
      setEditTarget(null)
      await refetchList()
    } catch (err: any) {
      notify.error(errorMessage(err, { 409: CONFLICT.manualDuplicate }, 'Error al actualizar el registro'))
    } finally {
      setEditSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await consumptionApi.deleteManual(deleteTarget.id)
      notify.success('Registro manual eliminado.')
      setDeleteTarget(null)
      await refetchList()
    } catch (err) {
      notify.error(err)
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const isSuspended = student?.is_suspended ?? false
  const canSave = !!student && !!date

  const orderOptions = [
    { value: 'document_id:asc',   label: 'Cédula (ascendente)'  },
    { value: 'document_id:desc',  label: 'Cédula (descendente)' },
    { value: 'registered_at:asc',  label: 'Hora (más antiguo)'  },
    { value: 'registered_at:desc', label: 'Hora (más reciente)' },
  ]

  function handleOrderChange(value: string) {
    const [by, dir] = value.split(':') as [ManualOrderBy, OrderDir]
    setOrderBy(by)
    setOrderDir(dir)
  }

  const columns: ColumnDef<ManualConsumption>[] = [
    {
      key: 'document_id',
      header: 'Cédula',
      render: (_, row) => <span className="font-medium text-slate-800">{row.document_id}</span>,
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (_, row) => <span className="text-slate-700">{row.first_name} {row.last_name}</span>,
    },
    {
      key: 'user_type',
      header: 'Tipo',
      render: (_, row) => (
        <Badge variant="info">{userTypeLabel(row.user_type)}</Badge>
      ),
    },
    {
      key: 'career',
      header: 'Carrera',
      render: (_, row) => <span className="text-slate-500">{row.career ?? '—'}</span>,
    },
    {
      key: 'registered_at',
      header: 'Hora',
      render: (_, row) => <span className="text-slate-500">{formatTime(row.registered_at)}</span>,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Registro Manual de Estudiantes"
        subtitle="Registra manualmente el consumo de comedor asociado a una fecha"
      />

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Card variant="outlined" padding="lg" className="mb-6">
        <p className="mb-4 text-sm font-semibold text-blue-600">Datos del Registro</p>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="fecha-manual"
            type="date"
            label="Fecha del registro*"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
          />
        </div>

        <div className="mb-4 flex items-end gap-3">
          <Input
            id="cedula-manual"
            label="Cédula / Carnet*"
            placeholder="Ingrese número de cédula o carnet"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            onKeyDown={handleKeyDown}
            leftIcon={<Search size={16} />}
            fullWidth
          />
          <Button
            variant="primary"
            onClick={handleSearch}
            loading={loading}
            className="flex-shrink-0"
          >
            Buscar
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        )}

        {!loading && searched && !student && !error && (
          <p className="text-sm text-slate-400">
            No se encontró ningún estudiante con la cédula <strong>{cedula}</strong>.
          </p>
        )}

        {!loading && student && (
          <StudentResultCard student={student} suspended={isSuspended} bare />
        )}

        <div className="mt-5 flex gap-3">
          <Button
            variant="primary"
            leftIcon={<Save size={15} />}
            loading={saving}
            disabled={!canSave}
            onClick={handleSave}
          >
            Guardar Registro
          </Button>
          <Button
            variant="secondary"
            leftIcon={<RotateCcw size={15} />}
            onClick={handleClear}
          >
            Limpiar campos
          </Button>
        </div>
      </Card>

      {/* Listado de registros manuales de la fecha seleccionada */}
      <Card variant="outlined" padding="lg">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-blue-600">Registros manuales de la fecha</p>
            <p className="text-xs text-slate-500">
              {rows.length} registro{rows.length !== 1 ? 's' : ''} cargado{rows.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-end gap-3">
            <Select
              options={orderOptions}
              value={`${orderBy}:${orderDir}`}
              onChange={(e) => handleOrderChange(e.target.value)}
              className="w-full sm:w-52"
            />
            <Button
              variant="secondary"
              leftIcon={<Printer size={15} />}
              onClick={() => printManualList(date, rows)}
              disabled={rows.length === 0}
            >
              Imprimir
            </Button>
          </div>
        </div>

        <Table<ManualConsumption>
          columns={columns}
          rows={rows}
          keyField="id"
          loading={listLoading}
          emptyMessage="No hay registros manuales para la fecha seleccionada."
          actions={(row) => (
            <>
              <button
                type="button"
                title="Editar"
                className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                onClick={() => openEdit(row)}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                title="Eliminar"
                className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                onClick={() => setDeleteTarget(row)}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        />
      </Card>

      {/* Modal de edición */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Editar registro manual"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditTarget(null)} disabled={editSaving}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" onClick={confirmEdit} loading={editSaving}>
              Guardar cambios
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            id="edit-fecha"
            type="date"
            label="Fecha del registro"
            value={editDate}
            max={todayISO()}
            onChange={(e) => setEditDate(e.target.value)}
            fullWidth
          />
          <Input
            id="edit-cedula"
            label="Cédula del acceso directo"
            hint="Cambia la cédula para reasignar el registro a otra persona."
            value={editCedula}
            onChange={(e) => setEditCedula(e.target.value)}
            leftIcon={<Search size={16} />}
            fullWidth
          />
        </div>
      </Modal>

      {/* Modal de confirmación de eliminación */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar registro manual"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" onClick={confirmDelete} loading={deleteLoading}>
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar el registro manual de{' '}
          <span className="font-semibold text-slate-900">
            {deleteTarget?.first_name} {deleteTarget?.last_name}
          </span>{' '}
          (C.I. {deleteTarget?.document_id})? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  )
}
