import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { accesoDirectoApi } from '../api/acceso_directo'
import { accessReasonApi } from '../api/accessReason'
import type { AccesoDirecto, AccesoDirectoCreate, AccesoDirectoUpdate, AccessReason, UserType, AccesoDirectoStatus } from '../types/acceso_directo'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Button } from './ui/Button'
import type { ApiError } from '../types/auth'

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => void
  initial?: AccesoDirecto | null
}

const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
  { value: 'STUDENT',        label: 'Estudiante'     },
  { value: 'TEACHER',        label: 'Docente'        },
  { value: 'ADMINISTRATIVE', label: 'Administrativo' },
  { value: 'WORKER',         label: 'Obrero'         },
]

const STATUS_OPTIONS: { value: AccesoDirectoStatus; label: string }[] = [
  { value: 'ACTIVE',    label: 'Activo'     },
  { value: 'SUSPENDED', label: 'Suspendido' },
  { value: 'INACTIVE',  label: 'Inactivo'   },
]

const EMPTY = {
  first_name:  '',
  last_name:   '',
  document_id: '',
  card_code:   '',
  career:      '',
  photo_url:   '',
  access_reason_id: '',
  is_priority: false,
  user_type:   'STUDENT' as UserType,
  status:      'ACTIVE' as AccesoDirectoStatus,
}

export function AccesoDirectoFormModal({ open, onClose, onSave, initial }: Props) {
  const [form,     setForm]     = useState(EMPTY)
  const [reasons,  setReasons]  = useState<AccessReason[]>([])
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            first_name:  initial.first_name,
            last_name:   initial.last_name,
            document_id: initial.document_id,
            card_code:   initial.card_code ?? '',
            career:      initial.career ?? '',
            photo_url:   initial.photo_url ?? '',
            access_reason_id: initial.access_reason_id != null ? String(initial.access_reason_id) : '',
            is_priority: initial.is_priority ?? false,
            user_type:   initial.user_type,
            status:      initial.status,
          }
        : { ...EMPTY },
    )
    setErrors({})
    setApiError(null)
  }, [open, initial])

  // Carga los motivos/roles de acceso directo para el selector.
  useEffect(() => {
    if (!open) return
    accessReasonApi
      .list()
      .then(setReasons)
      .catch(() => setReasons([]))
  }, [open])

  const set =
    (field: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!form.first_name.trim())  errs.first_name  = 'El nombre es obligatorio'
    if (!form.last_name.trim())   errs.last_name   = 'El apellido es obligatorio'
    if (!form.document_id.trim()) errs.document_id = 'La cédula es obligatoria'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError(null)
    try {
      const accessReasonId = form.access_reason_id ? Number(form.access_reason_id) : null
      if (initial) {
        const payload: AccesoDirectoUpdate = {
          first_name:  form.first_name,
          last_name:   form.last_name,
          card_code:   form.card_code || undefined,
          career:      form.career || undefined,
          photo_url:   form.photo_url.trim() || null,
          access_reason_id: accessReasonId,
          is_priority: form.is_priority,
          user_type:   form.user_type,
          status:      form.status,
        }
        await accesoDirectoApi.update(initial.id, payload)
      } else {
        const payload: AccesoDirectoCreate = {
          first_name:  form.first_name,
          last_name:   form.last_name,
          document_id: form.document_id,
          // Si no se indica carnet, se autocompleta con la cédula.
          card_code:   form.card_code.trim() || form.document_id.trim(),
          career:      form.career || undefined,
          photo_url:   form.photo_url.trim() || undefined,
          access_reason_id: accessReasonId,
          is_priority: form.is_priority,
          user_type:   form.user_type,
        }
        await accesoDirectoApi.create(payload)
      }
      onSave()
      onClose()
    } catch (err: unknown) {
      const e = err as ApiError
      setApiError(e.message ?? 'Error al guardar el acceso directo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Acceso Directo' : 'Nuevo Acceso Directo'}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            {initial ? 'Guardar cambios' : 'Crear acceso directo'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {apiError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Nombre"
            value={form.first_name}
            onChange={set('first_name')}
            error={errors.first_name}
            placeholder="Ej. Juan"
          />
          <Input
            label="Apellido"
            value={form.last_name}
            onChange={set('last_name')}
            error={errors.last_name}
            placeholder="Ej. Pérez"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Cédula"
            value={form.document_id}
            onChange={set('document_id')}
            error={errors.document_id}
            placeholder="Ej. V-12345678"
          />
          <Input
            label="Carnet (opcional)"
            value={form.card_code}
            onChange={set('card_code')}
            error={errors.card_code}
            placeholder="Se autocompleta con la cédula si se deja vacío"
          />
        </div>

        <Input
          label="Carrera / Departamento"
          value={form.career}
          onChange={set('career')}
          placeholder="Ej. Ing. Informática"
        />

        <Select
          label="Motivo / Rol de acceso directo"
          options={[
            { value: '', label: 'Sin motivo' },
            ...reasons.map((r) => ({ value: String(r.id), label: r.name })),
          ]}
          value={form.access_reason_id}
          onChange={set('access_reason_id')}
        />

        <Input
          label="Foto (URL)"
          value={form.photo_url}
          onChange={set('photo_url')}
          placeholder="https://… o ruta de la foto"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Tipo de usuario"
            options={USER_TYPE_OPTIONS}
            value={form.user_type}
            onChange={set('user_type')}
          />
          {initial && (
            <Select
              label="Estado"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={set('status')}
            />
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 hover:bg-slate-50">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-yellow-500"
            checked={form.is_priority}
            onChange={(e) => setForm((prev) => ({ ...prev, is_priority: e.target.checked }))}
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-800">Acceso Directo Prioritario</span>
            <span className="text-xs text-slate-400">Tiene prioridad de acceso al comedor</span>
          </div>
        </label>
      </div>
    </Modal>
  )
}
