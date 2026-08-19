import { CheckCircle2, Download, Save } from 'lucide-react'

interface LunchFooterActionsProps {
  onSaveDraft: () => void
  onConfirm: () => void
  onDownload: () => void
  savingDraft?: boolean
  confirming?: boolean
  saveDisabled?: boolean
  confirmDisabled?: boolean
  downloadDisabled?: boolean
}

const baseButton =
  'inline-flex h-[45px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-[10px] px-6 text-[15px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50'

/**
 * FE-02 — dos acciones, dos consecuencias.
 *
 * «Guardar borrador» solo persiste; «Confirmar» descuenta el inventario y deja
 * el servicio inmutable. Antes ambas cosas vivían tras un único botón
 * «Guardar», así que quien solo quería anotar el menú del viernes descontaba la
 * despensa sin haberlo pedido. Mientras una petición está en curso las dos se
 * deshabilitan: el doble envío aquí significa doble descuento.
 */
export function LunchFooterActions({
  onSaveDraft,
  onConfirm,
  onDownload,
  savingDraft = false,
  confirming = false,
  saveDisabled = false,
  confirmDisabled = false,
  downloadDisabled = false,
}: LunchFooterActionsProps) {
  const busy = savingDraft || confirming

  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row sm:flex-wrap sm:gap-6">
      <button
        type="button"
        onClick={onSaveDraft}
        disabled={busy || saveDisabled}
        className={`${baseButton} bg-[#03216a] hover:bg-[#021a52]`}
      >
        <Save size={22} />
        {savingDraft ? 'Guardando...' : 'Guardar borrador'}
      </button>

      <button
        type="button"
        onClick={onConfirm}
        disabled={busy || confirmDisabled}
        className={`${baseButton} bg-green-700 hover:bg-green-800`}
      >
        <CheckCircle2 size={22} />
        {confirming ? 'Confirmando...' : 'Confirmar servicio'}
      </button>

      <button
        type="button"
        onClick={onDownload}
        disabled={downloadDisabled}
        className={`${baseButton} bg-[#03216a] hover:bg-[#021a52]`}
      >
        <Download size={22} />
        Descargar lista
      </button>
    </div>
  )
}
