import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { externalPersonApi } from '../api/externalPerson'
import { errorMessage } from '../utils/apiErrors'
import { notify } from '../utils/toast'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { Select } from '../components/ui/Select'
import { Table, type ColumnDef } from '../components/ui/Table'
import type {
  ExternalPerson,
  ExternalPersonStatus,
  ExternalPersonType,
} from '../types/externalPerson'

const TYPE_LABEL: Record<ExternalPersonType, string> = {
  JUBILADO: 'Jubilado',
  EXTERNO: 'Persona externa',
}

const TYPE_OPTIONS = [
  { value: 'JUBILADO', label: 'Jubilado' },
  { value: 'EXTERNO', label: 'Persona externa' },
]

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
  person_type: ExternalPersonType
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
  person_type: 'EXTERNO',
  career: '',
  status: 'ACTIVE',
}

export function ExternalPeoplePage() {
  const [people, setPeople] = useState<ExternalPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ExternalPerson | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<ExternalPerson | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadPeople = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const res = await externalPersonApi.list({
        search: search || undefined,
        person_type: (typeFilter || undefined) as ExternalPersonType | undefined,
        status: (statusFilter || undefined) as ExternalPersonStatus | undefined,
      })
      setPeople(res.items)
    } catch (err) {
      setLoadError(errorMessage(err, {}, 'No se pudo cargar la gente externa.'))
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter])

  useEffect(() => {
    void loadPeople()
  }, [loadPeople])

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
      person_type: person.person_type,
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
    setSaving(true)
    setFormError('')
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      card_code: form.card_code.trim() || null,
      email: form.email.trim() || null,
      gender: form.gender || null,
      person_type: form.person_type,
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
      notify.success('Persona externa eliminada.')
      setDeleteTarget(null)
      await loadPeople()
    } catch (err) {
      setDeleteError(errorMessage(err, {}, 'No se pudo eliminar la persona externa.'))
    } finally {
      setDeleting(false)
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
      key: 'person_type',
      header: 'Tipo',
      render: (_, p) => <Badge variant="info">{TYPE_LABEL[p.person_type]}</Badge>,
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
        subtitle="Registra y gestiona jubilados y personas externas que acceden al comedor"
        actions={
          <Button size="sm" leftIcon={<Plus size={16} />} onClick={openCreate}>
            Registrar persona
          </Button>
        }
      />

      <Card variant="outlined" padding="md">
        <div className="flex flex-wrap gap-4">
          <Input
            label="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nombre o cédula"
            className="w-full sm:w-64"
          />
          <Select
            label="Tipo"
            options={[{ value: '', label: 'Todos' }, ...TYPE_OPTIONS]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-48"
          />
          <Select
            label="Estado"
            options={[{ value: '', label: 'Todos' }, ...STATUS_OPTIONS]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-48"
          />
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
            <Input label="Nombre" value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} fullWidth />
            <Input label="Apellido" value={form.last_name} onChange={(e) => setField('last_name', e.target.value)} fullWidth />
            <Input
              label="Cédula / Identificador"
              value={form.document_id}
              onChange={(e) => setField('document_id', e.target.value)}
              readOnly={!!editTarget}
              hint={editTarget ? 'La cédula no se puede cambiar' : undefined}
              fullWidth
            />
            <Input label="Carnet (opcional)" value={form.card_code} onChange={(e) => setField('card_code', e.target.value)} fullWidth />
            <Select
              label="Tipo de persona"
              options={TYPE_OPTIONS}
              value={form.person_type}
              onChange={(e) => setField('person_type', e.target.value as ExternalPersonType)}
              fullWidth
            />
            <Select
              label="Género"
              options={GENDER_OPTIONS}
              value={form.gender}
              onChange={(e) => setField('gender', e.target.value)}
              fullWidth
            />
            <Input label="Carrera / Área (opcional)" value={form.career} onChange={(e) => setField('career', e.target.value)} fullWidth />
            <Input label="Correo (opcional)" type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} fullWidth />
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
        title="Eliminar persona externa"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" disabled={deleting} onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="danger" size="sm" loading={deleting} onClick={handleConfirmDelete}>
              Eliminar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          {deleteError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</div>
          )}
          <p className="text-sm text-slate-600">
            ¿Seguro que deseas eliminar a{' '}
            <strong>{deleteTarget ? `${deleteTarget.first_name} ${deleteTarget.last_name}` : ''}</strong>?
          </p>
        </div>
      </Modal>
    </div>
  )
}
