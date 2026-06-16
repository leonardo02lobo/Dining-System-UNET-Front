import { Download, Save } from 'lucide-react'

interface LunchFooterActionsProps {
  onSave: () => void
  onDownload: () => void
  saving?: boolean
  downloadDisabled?: boolean
  saveAsTemplate: boolean
  onSaveAsTemplateChange: (value: boolean) => void
}

export function LunchFooterActions({
  onSave,
  onDownload,
  saving = false,
  downloadDisabled = false,
  saveAsTemplate,
  onSaveAsTemplateChange,
}: LunchFooterActionsProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row sm:flex-wrap sm:gap-8">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-[45px] min-w-[200px] items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-6 text-[15px] font-bold text-white transition hover:bg-[#021a52] disabled:opacity-60"
      >
        <Save size={22} />
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
      <label className="inline-flex h-[45px] items-center gap-2 rounded-[10px] border border-slate-300 bg-white px-4 text-[15px] font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={saveAsTemplate}
          onChange={(e) => onSaveAsTemplateChange(e.target.checked)}
          disabled={saving}
          className="h-4 w-4 rounded border-slate-300 text-[#03216a] focus:ring-[#03216a]"
        />
        Guardar como plantilla
      </label>
      <button
        type="button"
        onClick={onDownload}
        disabled={downloadDisabled}
        className="inline-flex h-[45px] min-w-[200px] items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-6 text-[15px] font-bold text-white transition hover:bg-[#021a52] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={22} />
        Descargar lista
      </button>
    </div>
  )
}
