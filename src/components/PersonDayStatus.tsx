import type { ReactNode } from 'react'
import { CheckCircle2, XCircle, MinusCircle, ShieldCheck, AlertTriangle, MapPin } from 'lucide-react'
import { previousConsumptionMessage, isOtherSedeConsumption } from '../utils/consumptionNotice'
import type { ConsumptionCheckByDocument } from '../types/consumption'
import type { Student } from '../types/user'

type Variant = 'neutral' | 'success' | 'warning' | 'danger'

const VARIANT_CLASSES: Record<Variant, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-600',
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger:  'border-red-200 bg-red-50 text-red-700',
}

function StatusBox({ variant, icon, children }: { variant: Variant; icon: ReactNode; children: ReactNode }) {
  return (
    <div className={`flex items-start gap-2.5 rounded-md border px-3 py-2 text-sm ${VARIANT_CLASSES[variant]}`}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

interface PersonDayStatusProps {
  /** Persona en pantalla. Las cajas solo existen cuando hay a quién referirse. */
  student: Student
  /** Resultado de `checkByDocument`, o `null` si la comprobación no pudo completarse. */
  check: ConsumptionCheckByDocument | null
  /**
   * Sede en la que se está atendiendo. Sirve para distinguir un consumo de la propia
   * sede de uno de otra: son el mismo hecho para la base de datos y dos conversaciones
   * muy distintas en la taquilla.
   */
  currentSedeName?: string | null
}

/**
 * Las dos afirmaciones que el operador necesita de un vistazo: **consumo del día** y
 * **sanción**.
 *
 * Ambas se dibujan siempre que haya persona, incluido cuando la respuesta es buena. La
 * pantalla de registro solo pintaba avisos negativos, de modo que "todo en orden" había
 * que deducirlo de que no hubiera nada — con el lector en la mano y la fila esperando, y
 * siendo esa ausencia indistinguible de un fallo de carga.
 *
 * Por eso el fallo tiene su propio estado en gris: un error nunca se presenta como
 * "no ha consumido".
 */
export function PersonDayStatus({ student, check, currentSedeName }: PersonDayStatusProps) {
  const isExternal = student.person_kind === 'external'
  const otherSede =
    check?.consumption != null && isOtherSedeConsumption(check.consumption, currentSedeName)

  const consumption =
    check === null ? (
      <StatusBox variant="neutral" icon={<MinusCircle size={16} />}>
        No se pudo comprobar el consumo de hoy. El registro sigue disponible; el servidor
        rechazará un duplicado.
      </StatusBox>
    ) : check.has_consumed && check.consumption ? (
      // Consumo en otra sede: en rojo y con su propio icono. En ámbar, junto al
      // duplicado de la propia sede, el operador lo lee como "ya comió" y se pierde
      // lo único que aquí no puede averiguar por su cuenta: dónde.
      <StatusBox
        variant={otherSede ? 'danger' : 'warning'}
        icon={otherSede ? <MapPin size={16} /> : <AlertTriangle size={16} />}
      >
        {previousConsumptionMessage(check.consumption, { currentSedeName })}
      </StatusBox>
    ) : check.has_consumed ? (
      // `has_consumed` sin detalle: un servidor antiguo puede no traerlo. Se afirma el
      // hecho sin inventar la hora ni la sede.
      <StatusBox variant="warning" icon={<AlertTriangle size={16} />}>
        Ya registró su consumo hoy.
      </StatusBox>
    ) : (
      <StatusBox variant="success" icon={<CheckCircle2 size={16} />}>
        No ha consumido en la sesión de hoy.
      </StatusBox>
    )

  // A la gente externa no se la sanciona: el backend ni siquiera consulta su sanción.
  // Afirmar "sin sanción activa" sobre ella prometería un historial que no existe.
  const sanction = isExternal ? (
    <StatusBox variant="neutral" icon={<MinusCircle size={16} />}>
      A la gente externa no se la sanciona. Para retirarle el acceso, dale de baja en
      Gente Externa.
    </StatusBox>
  ) : check === null ? (
    <StatusBox variant="neutral" icon={<MinusCircle size={16} />}>
      No se pudo comprobar el estado de sanción.
    </StatusBox>
  ) : check.active_sanction ? (
    <StatusBox variant="danger" icon={<XCircle size={16} />}>
      Sanción activa: {check.active_sanction.reason}
    </StatusBox>
  ) : student.is_suspended ? (
    // Sin sanción activa, `is_suspended` viene de `is_active: false` en el padrón. No es
    // lo mismo que estar sancionado y no se explica igual, aunque bloquee igual.
    <StatusBox variant="danger" icon={<XCircle size={16} />}>
      No está activo en el padrón de la UNET y no puede registrar consumo.
    </StatusBox>
  ) : (
    <StatusBox variant="success" icon={<ShieldCheck size={16} />}>
      Sin sanción activa.
    </StatusBox>
  )

  return (
    <div className="flex flex-col gap-2">
      {consumption}
      {sanction}
    </div>
  )
}
