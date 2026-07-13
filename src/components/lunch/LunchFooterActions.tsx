import { Download, Save } from 'lucide-react'

interface LunchFooterActionsProps {
  onSave: () => void
  onDownload: () => void
  saving?: boolean
  downloadDisabled?: boolean
}

export function LunchFooterActions({
  onSave,
  onDownload,
  saving = false,
  downloadDisabled = false,
}: LunchFooterActionsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row sm:flex-wrap sm:gap-8">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-[45px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-6 text-[15px] font-bold text-white transition hover:bg-[#021a52] disabled:opacity-60"
      >
        <Save size={22} />
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      <button
        type="button"
        onClick={onDownload}
        disabled={downloadDisabled}
        className="inline-flex h-[45px] w-full sm:w-auto items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-6 text-[15px] font-bold text-white transition hover:bg-[#021a52] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={22} />
        Descargar lista
      </button>
    </div>
  )
}
