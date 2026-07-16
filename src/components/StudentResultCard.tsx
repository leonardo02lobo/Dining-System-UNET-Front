import { useEffect, useState, type ReactNode } from 'react'
import { Avatar } from './ui/Avatar'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import { sanctionApi } from '../api/sanction'
import type { Student } from '../types/user'

interface StudentResultCardProps {
  student: Student
  /** Estado mostrado en el badge. Por defecto usa `student.is_suspended`. */
  suspended?: boolean
  /** Muestra el aviso de "acceso directo" vs. "alta al vuelo". Por defecto true. */
  showAccesoDirectoNotice?: boolean
  /**
   * Muestra cuántas veces ha sido suspendida la persona (issue #8). Por defecto true.
   * Solo aplica a personas con acceso directo (los externos no tienen historial).
   */
  showSuspensionCount?: boolean
  /** Contenido adicional bajo los datos (avisos de sanción, consumo del día, etc.). */
  notice?: ReactNode
  /** Botones de acción específicos de cada pantalla (Registrar, Guardar, Suspender…). */
  actions?: ReactNode
  /** Si es true, no envuelve en <Card> (para insertarlo dentro de otra tarjeta). */
  bare?: boolean
  /**
   * Número de veces que la persona ha sido suspendida (histórico, #8). Solo aplica
   * a personas con acceso directo; si es `null`/`undefined` no se muestra el contador.
   */
  suspensionCount?: number | null
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <Input value={value} readOnly fullWidth />
    </div>
  )
}

/**
 * Ficha compartida de un estudiante/acceso directo consultado. Unifica la
 * presentación que antes duplicaban `RegisterDining`, `CheckConsumes` y el
 * registro manual: avatar, estado, datos y ranuras para avisos/acciones.
 */
export function StudentResultCard({
  student,
  suspended,
  showAccesoDirectoNotice = true,
  showSuspensionCount = true,
  notice,
  actions,
  bare = false,
  suspensionCount,
}: StudentResultCardProps) {
  const isSuspended = suspended ?? student.is_suspended ?? false

  // Conteo de veces suspendido (issue #8): total histórico de sanciones de la persona.
  const [suspensionCount, setSuspensionCount] = useState<number | null>(null)
  useEffect(() => {
    const id = student.acceso_directo_id
    if (!showSuspensionCount || !id) {
      setSuspensionCount(null)
      return
    }
    let active = true
    sanctionApi.history(id)
      .then((res) => { if (active) setSuspensionCount(res.total) })
      .catch(() => { if (active) setSuspensionCount(null) })
    return () => { active = false }
  }, [student.acceso_directo_id, showSuspensionCount])

  const content = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex flex-col items-center gap-3">
        <Avatar name={student.name} src={student.avatar_url} shape="square" />
        <Badge variant={isSuspended ? 'danger' : 'success'}>
          {isSuspended ? 'Suspendido' : 'Activo'}
        </Badge>
        {suspensionCount !== null && (
          <Badge variant={suspensionCount > 0 ? 'warning' : 'neutral'}>
            {suspensionCount > 0
              ? `Suspendido ${suspensionCount} ${suspensionCount === 1 ? 'vez' : 'veces'}`
              : 'Sin suspensiones'}
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField label="Documento" value={student.cedula} />
          <ReadOnlyField label="Nombre" value={student.name} />
          <div className="sm:col-span-2">
            <ReadOnlyField label="Email" value={student.email ?? '—'} />
          </div>
        </div>

        {showAccesoDirectoNotice && (
          student.is_acceso_directo ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Usuario con acceso directo
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              Este usuario no tiene acceso directo. Se registrará su consumo y se dará de alta automáticamente.
            </div>
          )
        )}

        {notice}

        {actions && (
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  )

  if (bare) return content
  return (
    <Card variant="outlined" padding="md">
      {content}
    </Card>
  )
}
