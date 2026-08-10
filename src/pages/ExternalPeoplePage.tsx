import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, UserMinus } from 'lucide-react'
import { externalPersonApi } from '../api/externalPerson'
import { externalPersonLabelApi } from '../api/externalPersonLabel'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../utils/apiErrors'
import { notify } from '../utils/toast'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CareerInput } from '../components/CareerInput'
import { ExternalPersonLabelSelect } from '../components/ExternalPersonLabelSelect'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { Table, type ColumnDef } from '../components/ui/Table'
import type { ExternalPerson, ExternalPersonStatus } from '../types/externalPerson'
import type { ExternalPersonLabel } from '../types/externalPersonLabel'

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
]

const GENDER_OPTIONS = [
  { value: '', label: '—' },
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

interface FormState {
  first_name: string
  last_name: string
  document_id: string
  card_code: string
  email: string
  gender: string
  label_id: number | null
  career: string
  status: ExternalPersonStatus
}

const EMPTY_FORM: FormState = {
  first_name: '',
  last_name: '',
  document_id: '',
  card_code: '',
  email: '',
  gender: '',
  label_id: null,
  career: '',
  status: 'ACTIVE',
}

export function ExternalPeoplePage() {
  const { user } = useAuth()
  // La baja en lote no la gobierna ninguna pantalla: el servidor la reserva al rol
  // SUPER_ADMIN y la declara inconcedible (`permisos-suelo-por-rol`). Comprobar el
  // rol aquí es usar el mismo criterio que el servidor, no traducirlo.
  const canBulkDeactivate = user?.role?.name === 'SUPER_ADMIN'

  const [people, setPeople] = useState<ExternalPerson[]>([])
  const [labels, setLabels] = useState<ExternalPersonLabel[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [labelFilter, setLabelFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ExternalPerson | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ExternalPerson | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Baja en lote por etiqueta.
  const [bulkTarget, setBulkTarget] = useState<ExternalPersonLabel | null>(null)
  const [bulkCount, setBulkCount] = useState<number | null>(null)
  const [bulkConfirmText, setBulkConfirmText] = useState('')
  const [bulkError, setBulkError] = useState('')
  const [bulkRunning, setBulkRunning] = useState(false)

  const loadPeople = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await externalPersonApi.list({
        search: search || undefined,
        label_id: labelFilter ? Number(labelFilter) : undefined,
        status: (statusFilter || undefined) as ExternalPersonStatus | undefined,
      })
      setPeople(res.items)
    } catch (err) {
      setLoadError(errorMessage(err, {}, 'No se pudo cargar la gente externa.'))
    } finally {
      setLoading(false)
    }
  }, [search, labelFilter, statusFilter])

  useEffect(() => {
    void loadPeople()
  }, [loadPeople])

  const loadLabels = useCallback(async () => {
    try {
      setLabels((await externalPersonLabelApi.list()).items)
    } catch {
      // El filtro se queda sin opciones; la pantalla sigue usable.
      setLabels([])
    }
  }, [])

  useEffect(() => {
    void loadLabels()
  }, [loadLabels])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(person: ExternalPerson) {
    setEditTarget(person)
    setForm({
      first_name: person.first_name,
      last_name: person.last_name,
      document_id: person.document_id,
      card_code: person.card_code ?? '',
      email: person.email ?? '',
      gender: person.gender ?? '',
      label_id: person.label_id,
      career: person.career ?? '',
      status: person.status,
    })
    setFormError('')
    setModalOpen(true)
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('El nombre y el apellido son obligatorios.')
      return
    }
    if (!editTarget && !form.document_id.trim()) {
      setFormError('La cédula/identificador es obligatoria.')
      return
    }
    if (form.label_id == null) {
      setFormError('Elige una etiqueta.')
      return
    }
    setSaving(true)
    setFormError('')
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      card_code: form.card_code.trim() || null,
      email: form.email.trim() || null,
      gender: form.gender || null,
      label_id: form.label_id,
      career: form.career.trim() || null,
      status: form.status,
    }
    try {
      if (editTarget) {
        await externalPersonApi.update(editTarget.id, payload)
        notify.success('Persona externa actualizada.')
      } else {
        await externalPersonApi.create({ ...payload, document_id: form.document_id.trim() })
        notify.success('Persona externa registrada.')
      }
      setModalOpen(false)
      await loadPeople()
    } catch (err) {
      setFormError(
        errorMessage(
          err,
          { 409: 'Ya existe una persona con esa cédula/identificador.' },
          'No se pudo guardar la persona externa.',
        ),
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    setDeleteError('')
    try {
      await externalPersonApi.remove(deleteTarget.id)
      notify.success('La persona quedó inactiva y ya no puede acceder al comedor.')
      setDeleteTarget(null)
      await loadPeople()
    } catch (err) {
      setDeleteError(errorMessage(err, {}, 'No se pudo dar de baja a la persona externa.'))
    } finally {
      setDeleting(false)
    }
  }

  /**
   * Abre la confirmación del lote con el recuento **real** de gente alcanzada.
   * Va en el modal y no solo en el mensaje posterior: después de pulsar ya no sirve.
   */
  async function openBulkDeactivate() {
    const label = labels.find((l) => String(l.id) === labelFilter)
    if (!label) return
    setBulkTarget(label)
    setBulkConfirmText('')
    setBulkError('')
    setBulkCount(null)
    try {
      const res = await externalPersonApi.list({ label_id: label.id, limit: 1 })
      setBulkCount(res.total)
    } catch {
      // Sin recuento el modal sigue abriéndose; el servidor devolverá el suyo.
      setBulkCount(null)
    }
  }

  async function handleConfirmBulkDeactivate() {
    if (!bulkTarget) return
    setBulkRunning(true)
    setBulkError('')
    try {
      const res = await externalPersonLabelApi.deactivateAll(bulkTarget.id)
      // El recuento que se informa es el del servidor, no el que se calculó antes de
      // pulsar: entre el modal y la respuesta puede haberse dado de alta a alguien más.
      notify.success(
        res.unchanged > 0
          ? `${res.deactivated} personas quedaron inactivas (${res.unchanged} ya lo estaban).`
          : `${res.deactivated} personas quedaron inactivas.`,
      )
      setBulkTarget(null)
      await loadPeople()
    } catch (err) {
      setBulkError(errorMessage(err, {}, 'No se pudo dar de baja al grupo.'))
    } finally {
      setBulkRunning(false)
    }
  }

  const columns: ColumnDef<ExternalPerson>[] = [
    { key: 'document_id', header: 'Cédula', sortable: true },
    {
      key: 'last_name',
      header: 'Nombre',
      sortable: true,
      render: (_, p) => `${p.last_name}, ${p.first_name}`,
    },
    {
      key: 'label',
      header: 'Etiqueta',
      // Sin mapa de rótulos: con etiquetas que inventa el usuario, cualquier mapa en
      // el cliente sería una lista incompleta al día siguiente.
      render: (_, p) => <Badge variant="info">{p.label ?? '—'}</Badge>,
    },
    { key: 'career', header: 'Carrera', render: (_, p) => p.career ?? '—' },
    {
      key: 'status',
      header: 'Estado',
      render: (_, p) => (
        <Badge variant={p.status === 'ACTIVE' ? 'success' : 'neutral'}>
          {p.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gente Externa"
        subtitle="Registra y gestiona las personas externas que acceden al comedor, agrupadas por etiqueta"
        actions={
          <Button size="sm" leftIcon={<Plus size={16} />} onClick={openCreate}>
            Registrar persona
          </Button>
        }
      />

      <Card variant="outlined" padding="md">
        <div className="flex flex-wrap gap-4">
          <Input
            id="filter-search"
            label="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre o cédula"
            className="w-full sm:w-64"
          />
          <Select
            label="Etiqueta"
            options={[
              { value: '', label: 'Todas' },
              ...labels.map((l) => ({ value: String(l.id), label: l.name })),
            ]}
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            className="w-full sm:w-56"
          />
          <Select
            label="Estado"
            options={[{ value: '', label: 'Todos' }, ...STATUS_OPTIONS]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48"
          />
          {canBulkDeactivate && labelFilter && (
            <div className="flex items-end">
              <Button
                size="sm"
                variant="danger"
                leftIcon={<UserMinus size={16} />}
                onClick={() => void openBulkDeactivate()}
              >
                Dar de baja a todos los de esta etiqueta
              </Button>
            </div>
          )}
        </div>
      </Card>

      {loadError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</div>
      )}

      {loading ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Cargando...
        </div>
      ) : (
        <Table<ExternalPerson>
          columns={columns}
          rows={people}
          keyField="id"
          emptyMessage="No hay personas externas registradas."
          actions={(person) => (
            <>
              <button
                type="button"
                title="Editar"
                className="rounded p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                onClick={() => openEdit(person)}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                title="Eliminar"
                className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  setDeleteTarget(person)
                  setDeleteError('')
                }}
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        />
      )}

      {/* Modal crear/editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Editar persona externa' : 'Registrar persona externa'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={saving} onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" loading={saving} onClick={handleSave}>
              {editTarget ? 'Guardar' : 'Registrar'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="form-first-name" label="Nombre" value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} fullWidth />
            <Input id="form-last-name" label="Apellido" value={form.last_name} onChange={(e) => setField('last_name', e.target.value)} fullWidth />
            <Input
              id="form-document-id"
              label="Cédula / Identificador"
              value={form.document_id}
              onChange={(e) => setField('document_id', e.target.value)}
              readOnly={!!editTarget}
              hint={editTarget ? 'La cédula no se puede cambiar' : undefined}
              fullWidth
            />
            <Input id="form-card-code" label="Carnet (opcional)" value={form.card_code} onChange={(e) => setField('card_code', e.target.value)} fullWidth />
            <ExternalPersonLabelSelect
              id="form-label"
              value={form.label_id}
              onChange={(id) => setField('label_id', id)}
              onLabelsChanged={setLabels}
              fullWidth
            />
            <Select
              label="Género"
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(e) => setField('gender', e.target.value)}
              fullWidth
            />
            <CareerInput
              label="Carrera / Área (opcional)"
              value={form.career}
              onChange={(v) => setField('career', v)}
              fullWidth
            />
            <Input id="form-email" label="Correo (opcional)" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} fullWidth />
            <Select
              label="Estado"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => setField('status', e.target.value as ExternalPersonStatus)}
              fullWidth
            />
          </div>
        </div>
      </Modal>

      {/* Modal borrar */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Dar de baja a una persona externa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleConfirmDelete}>
              Dar de baja
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {deleteError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</div>
          )}
          <p className="text-sm text-slate-600">
            ¿Seguro que deseas dar de baja a{' '}
            <strong>{deleteTarget ? `${deleteTarget.first_name} ${deleteTarget.last_name}` : ''}</strong>?
          </p>
          <p className="text-sm text-slate-500">
            Quedará <strong>inactiva</strong> y dejará de poder acceder al comedor. Su historial
            de consumos se conserva, y puedes reactivarla editando su ficha.
          </p>
        </div>
      </Modal>

      {/* Baja en lote por etiqueta */}
      <Modal
        open={bulkTarget !== null}
        onClose={() => setBulkTarget(null)}
        title="Dar de baja a todo un grupo"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={bulkRunning} onClick={() => setBulkTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={bulkRunning}
              // Fricción deliberada: la acción alcanza a decenas de personas, está en
              // la misma pantalla que la baja individual y no tiene deshacer.
              disabled={bulkConfirmText.trim() !== (bulkTarget?.name ?? '')}
              onClick={handleConfirmBulkDeactivate}
            >
              Dar de baja al grupo
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {bulkError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{bulkError}</div>
          )}
          <p className="text-sm text-slate-600">
            Vas a dar de baja a{' '}
            <strong>
              {bulkCount == null ? 'todas las personas' : `${bulkCount} persona${bulkCount === 1 ? '' : 's'}`}
            </strong>{' '}
            con la etiqueta <strong>{bulkTarget?.name}</strong>.
          </p>
          <p className="text-sm text-slate-500">
            Quedarán <strong>inactivas</strong> y dejarán de poder acceder al comedor. Su historial
            de consumos se conserva y la etiqueta sigue disponible.
          </p>
          <Input
            id="bulk-deactivate-confirm"
            label={`Escribe «${bulkTarget?.name ?? ''}» para confirmar`}
            value={bulkConfirmText}
            onChange={(e) => setBulkConfirmText(e.target.value)}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  )
}
