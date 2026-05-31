import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { userApi } from '../api/user'
import type { UserAccount, Role, UserCreatePayload, UserUpdatePayload } from '../types/user'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Button } from './ui/Button'
import type { ApiError } from '../types/auth'

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => void
  initial?: UserAccount | null
  roles: Role[]
}

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN:       'Administrador',
  TAQUILLERO:  'Taquillero',
}

const STATUS_OPTIONS = [
  { value: 'true',  label: 'Activo'   },
  { value: 'false', label: 'Inactivo' },
]

const EMPTY = { name: '', email: '', password: '', role_id: '', is_active: 'true' }

export function UserFormModal({ open, onClose, onSave, initial, roles }: Props) {
  const [form,     setForm]     = useState(EMPTY)
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    if (!open) return
    setForm(
      initial
        ? {
            name:      initial.name,
            email:     initial.email,
            password:  '',
            role_id:   String(initial.role_id),
            is_active: String(initial.is_active),
          }
        : { ...EMPTY, role_id: roles[0] ? String(roles[0].id) : '' },
    )
    setErrors({})
    setApiError(null)
  }, [open, initial, roles])

  const handleChange =
    (field: string) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {}
    if (!form.name.trim())  errs.name  = 'El nombre es obligatorio'
    if (!form.email.trim()) errs.email = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Correo no válido'
    if (!initial && !form.password)
      errs.password = 'La contraseña es obligatoria al crear un usuario'
    if (!form.role_id) errs.role_id = 'Selecciona un rol'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setApiError(null)
    try {
      if (initial) {
        const payload: UserUpdatePayload = {
          name:      form.name,
          email:     form.email,
          role_id:   Number(form.role_id),
          is_active: form.is_active === 'true',
        }
        if (form.password) payload.password = form.password
        await userApi.update(initial.id, payload)
      } else {
        const payload: UserCreatePayload = {
          name:     form.name,
          email:    form.email,
          password: form.password,
          role_id:  Number(form.role_id),
        }
        await userApi.create(payload)
      }
      onSave()
      onClose()
    } catch (err) {
      const error = err as ApiError
      setApiError(error.message ?? 'Error al guardar el usuario')
    } finally {
      setLoading(false)
    }
  }

  const roleOptions = roles.map((r) => ({
    value: String(r.id),
    label: ROLE_LABEL[r.name] ?? r.name,
  }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Usuario' : 'Nuevo Usuario'}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleSubmit} loading={loading}>
            {initial ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {apiError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-600">
            {apiError}
          </div>
        )}

        <Input
          label="Nombre completo"
          placeholder="Ej. María González"
          value={form.name}
          onChange={handleChange('name')}
          error={errors.name}
          fullWidth
        />
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="correo@dominio.com"
          value={form.email}
          onChange={handleChange('email')}
          error={errors.email}
          fullWidth
        />
        <Input
          label={initial ? 'Contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
          type="password"
          placeholder={initial ? '••••••••' : 'Mínimo 8 caracteres'}
          value={form.password}
          onChange={handleChange('password')}
          error={errors.password}
          fullWidth
        />
        <Select
          label="Rol"
          options={roleOptions}
          value={form.role_id}
          onChange={handleChange('role_id')}
          error={errors.role_id}
          fullWidth
        />
        {initial && (
          <Select
            label="Estado"
            options={STATUS_OPTIONS}
            value={form.is_active}
            onChange={handleChange('is_active')}
            fullWidth
          />
        )}
      </div>
    </Modal>
  )
}
