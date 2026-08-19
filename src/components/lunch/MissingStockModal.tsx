import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { formatQuantity, formatStock } from '../../utils/lunchRecalculation'
import type { LunchMissingStockItem } from '../../types/lunch'

interface MissingStockModalProps {
  open: boolean
  items: LunchMissingStockItem[]
  onClose: () => void
  onGoToInventory?: () => void
}

/**
 * FE-04 — por qué no se pudo confirmar, insumo por insumo.
 *
 * Los números vienen del backend, medidos bajo el bloqueo de la confirmación:
 * son los que decidieron el rechazo, no una vista previa que pudo quedar vieja.
 * El servicio sigue siendo un borrador, así que cerrar este modal devuelve al
 * mismo trabajo sin haber perdido nada.
 */
export function MissingStockModal({
  open,
  items,
  onClose,
  onGoToInventory,
}: MissingStockModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Faltan insumos para confirmar"
      size="lg"
      footer={
        <>
          {onGoToInventory && (
            <Button variant="secondary" size="sm" onClick={onGoToInventory}>
              Ir al inventario
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={onClose}>
            Volver al borrador
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-slate-600">
          No se descontó <span className="font-semibold">ningún</span> insumo: el servicio
          sigue guardado como borrador. Carga las cantidades que faltan en el inventario y
          vuelve a confirmarlo.
        </p>

        {/* La tabla desborda horizontalmente en móvil en vez de romper la página. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <caption className="sr-only">
              Insumos con existencia insuficiente para confirmar el servicio
            </caption>
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-3 py-2">Insumo</th>
                <th scope="col" className="px-3 py-2 text-right">Requerido</th>
                <th scope="col" className="px-3 py-2 text-right">Disponible</th>
                <th scope="col" className="px-3 py-2 text-right">Faltante</th>
                <th scope="col" className="px-3 py-2">Unidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.ingredientId}>
                  <th scope="row" className="px-3 py-2 text-left font-medium text-slate-900">
                    {item.name}
                  </th>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                    {formatQuantity(item.requiredQuantity, item.unit)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                    {formatStock(item.availableStock, item.unit)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums text-red-600">
                    {formatQuantity(item.missingQuantity, item.unit)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  )
}
