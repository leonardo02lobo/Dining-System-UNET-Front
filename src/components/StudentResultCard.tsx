import { type ReactNode } from 'react'
import { Avatar } from './ui/Avatar'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { Input } from './ui/Input'
import type { Student } from '../types/user'

interface StudentResultCardProps {
  /**
   * Persona consultada. Obligatoria: la ficha solo se monta cuando hay alguien que
   * mostrar. El antiguo modo `null` dibujaba la ficha entera en blanco —marcadores
   * `—`, avatar vacío, insignia "Sin consultar"— para que la zona no apareciera de
   * golpe; ocupaba alto en una pantalla que debe caber sin scroll y enseñaba a mirar
   * sin leer. El estado vacío es ahora una sola línea, y vive en la pantalla.
   */
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

/**
 * Campo de la ficha. Un campo sin valor **no se dibuja**: un recuadro vacío ocupa el
 * mismo alto que uno lleno sin decir nada, y la ficha solo existe cuando hay persona,
 * así que un hueco aquí es un dato que falta, no un estado de espera.
 */
function ReadOnlyField({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <Input value={value} readOnly fullWidth />
    </div>
  )
}

/**
 * Ficha compartida de un estudiante/acceso directo consultado. Unifica la
 * presentación de la pantalla de comedor, la suspensión y el registro manual:
 * avatar, estado, datos y ranuras para avisos/acciones.
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
  const isSuspended = suspended ?? student.is_suspended
  // A la gente externa no se la sanciona: mostrar su contador de suspensiones sería
  // prometer un historial que no existe.
  const isExternal = student.person_kind === 'external'

  const content = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div className="flex flex-col items-center gap-3">
        <Avatar name={student.name} src={student.avatar_url} shape="square" />
        <Badge variant={isSuspended ? 'danger' : 'success'}>
          {isSuspended ? 'Suspendido' : 'Activo'}
        </Badge>
        {isExternal && <Badge variant="info">Persona externa</Badge>}
        {showSuspensionCount && !isExternal && suspensionCount != null && (
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
          {isExternal ? (
            <>
              <ReadOnlyField label="Carrera / Área" value={student.career} />
              {/* Donde un estudiante muestra su tipo de usuario, una persona externa
                  muestra su etiqueta: es lo que la clasifica. */}
              <ReadOnlyField label="Etiqueta" value={student.external_label} />
            </>
          ) : (
            <div className="sm:col-span-2">
              <ReadOnlyField label="Carrera" value={student.career} />
            </div>
          )}
        </div>

        {showAccesoDirectoNotice && (
          isExternal ? (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
              Persona externa registrada. Se registrará su consumo con su propia ficha.
            </div>
          ) : student.is_acceso_directo ? (
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
