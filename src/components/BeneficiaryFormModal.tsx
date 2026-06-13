import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { beneficiaryApi } from '../api/beneficiary'
import type { Beneficiary, BeneficiaryCreate, BeneficiaryUpdate, UserType, BeneficiaryStatus } from '../types/beneficiary'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Button } from './ui/Button'
import type { ApiError } from '../types/auth'

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => void
  initial?: Beneficiary | null
}

const USER_TYPE_OPTIONS: { value: UserType; label: string }[] = [
  { value: 'STUDENT',        label: 'Estudiante'     },
  { value: 'TEACHER',        label: 'Docente'        },
  { value: 'ADMINISTRATIVE', label: 'Administrativo' },
  { value: 'WORKER',         label: 'Obrero'         },
]

const STATUS_OPTIONS: { value: BeneficiaryStatus; label: string }[] = [
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
  is_priority: false,
  user_type:   'STUDENT' as UserType,
  status:      'ACTIVE' as BeneficiaryStatus,
}

export function BeneficiaryFormModal({ open, onClose, onSave, initial }: Props) {
  const [form,     setForm]     = useState(EMPTY)
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
            is_priority: initial.is_priority ?? false,
            user_type:   initial.user_type,
            status:      initial.status,
          }
        : { ...EMPTY },
    )
    setErrors({})
    setApiError(null)
  }, [open, initial])

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
    if (!form.card_code.trim())   errs.card_code   = 'El carnet es obligatorio'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError(null)
    try {
      if (initial) {
        const payload: BeneficiaryUpdate = {
          first_name:  form.first_name,
          last_name:   form.last_name,
          card_code:   form.card_code || undefined,
          career:      form.career || undefined,
          is_priority: form.is_priority,
          user_type:   form.user_type,
          status:      form.status,
        }
        await beneficiaryApi.update(initial.id, payload)
      } else {
        const payload: BeneficiaryCreate = {
          first_name:  form.first_name,
          last_name:   form.last_name,
          document_id: form.document_id,
          card_code:   form.card_code,
          career:      form.career || undefined,
          is_priority: form.is_priority,
          user_type:   form.user_type,
        }
        await beneficiaryApi.create(payload)
      }
      onSave()
      onClose()
    } catch (err: unknown) {
      const e = err as ApiError
      setApiError(e.message ?? 'Error al guardar el beneficiario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Beneficiario' : 'Nuevo Beneficiario'}
      size="md"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            {initial ? 'Guardar cambios' : 'Crear beneficiario'}
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
            label="Carnet"
            value={form.card_code}
            onChange={set('card_code')}
            error={errors.card_code}
            placeholder="Ej. 20241234"
          />
        </div>

        <Input
          label="Carrera / Departamento"
          value={form.career}
          onChange={set('career')}
          placeholder="Ej. Ing. Informática"
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
            <span className="text-sm font-medium text-slate-800">Beneficiario VIP</span>
            <span className="text-xs text-slate-400">Tiene prioridad de acceso al comedor</span>
          </div>
        </label>
      </div>
    </Modal>
  )
}
