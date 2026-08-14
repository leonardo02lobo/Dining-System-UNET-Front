import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { userApi } from '../api/user'
import type { UserAccount, Role, UserCreatePayload, UserUpdatePayload } from '../types/user'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { Button } from './ui/Button'
import type { ApiError } from '../types/auth'
import { roleLabel } from '../utils/labels'
import { SedeSelector } from './SedeSelector'
import { useAuth } from '../context/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => void
  initial?: UserAccount | null
  roles: Role[]
}

const STATUS_OPTIONS = [
  { value: 'true',  label: 'Activo'   },
  { value: 'false', label: 'Inactivo' },
]

const EMPTY = { name: '', email: '', password: '', role_id: '', is_active: 'true' }

export function UserFormModal({ open, onClose, onSave, initial, roles }: Props) {
  const { user } = useAuth()
  // Asignar la sede de otra cuenta es una operación de administración: el servidor solo
  // se la admite a un SUPER_ADMIN (`PUT /users/{id}` va por suelo de rol, no por permiso
  // de pantalla). Ofrecer el campo a quien no puede guardarlo es prometer un 403.
  const canAssignSede = user?.role.name === 'SUPER_ADMIN'

  const [form,     setForm]     = useState(EMPTY)
  // Fuera de `form` porque es un número y no una cadena de formulario; `null` es
  // "sin asignar", que es un valor con significado propio y no un campo vacío.
  const [sedeId,   setSedeId]   = useState<number | null>(null)
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
    setSedeId(initial?.sede_id ?? null)
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
        // Solo se envía si esta cuenta puede asignarla: mandar `sede_id` sin poder
        // hacerlo convertiría una edición normal de nombre en un 403.
        if (canAssignSede) payload.sede_id = sedeId
        if (form.password) payload.password = form.password
        await userApi.update(initial.id, payload)
      } else {
        const payload: UserCreatePayload = {
          name:     form.name,
          email:    form.email,
          password: form.password,
          role_id:  Number(form.role_id),
        }
        if (canAssignSede) payload.sede_id = sedeId
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
    label: roleLabel(r.name),
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
        {canAssignSede ? (
          <div className="flex flex-col gap-1">
            <SedeSelector value={sedeId} onChange={setSedeId} label="Sede asignada" />
            <p className="text-xs text-slate-500">
              Determina en qué comedor puede registrar consumos. Sin sede asignada, la
              cuenta puede consultar pero no registrar.
            </p>
          </div>
        ) : initial ? (
          // En lectura para quien no puede asignarla: un ADMIN necesita *ver* por qué
          // una cuenta no registra, aunque el cambio sea de un SUPER_ADMIN.
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-slate-900">Sede asignada</span>
            <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-100 px-3 text-sm text-slate-600">
              {initial.sede_name ?? 'Sin asignar'}
            </div>
            <p className="text-xs text-slate-500">Solo un SUPER_ADMIN puede cambiarla.</p>
          </div>
        ) : null}
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
