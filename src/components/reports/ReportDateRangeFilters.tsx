import { Download, BarChart3, FileSpreadsheet, FileText } from 'lucide-react'
import type { InventoryCategory } from '../../types/inventory'
import { DateInput } from '../ui/DateInput'

interface ReportDateRangeFiltersProps {
  dateFrom: string
  dateTo: string
  categoryId: string
  categories: InventoryCategory[]
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onGenerate: () => void
  onDownloadPdf: () => void
  onDownloadCsv: () => void
  loading?: boolean
  downloadingPdf?: boolean
  downloadingCsv?: boolean
  loadingCategories?: boolean
  downloadsDisabled?: boolean
}

const fieldLabel = 'mb-1 block text-[15px] text-black/60'
const dateInputClass =
  'flex h-[38px] w-full max-w-[180px] items-center gap-2 rounded-[5px] border border-black bg-white/90 px-3 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#03216a]/20'

const primaryBtn =
  'inline-flex h-[45px] min-w-[200px] items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-5 text-[15px] font-bold text-white transition hover:bg-[#021a52] disabled:opacity-60'

const exportBtn =
  'group flex min-h-[72px] min-w-[240px] flex-1 items-center gap-3 rounded-lg border bg-white px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60'

export function ReportDateRangeFilters({
  dateFrom,
  dateTo,
  categoryId,
  categories,
  onDateFromChange,
  onDateToChange,
  onCategoryChange,
  onGenerate,
  onDownloadPdf,
  onDownloadCsv,
  loading = false,
  downloadingPdf = false,
  downloadingCsv = false,
  loadingCategories = false,
  downloadsDisabled = false,
}: ReportDateRangeFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6">
        <div>
          <DateInput
            label="Fecha inicial"
            value={dateFrom}
            onChange={onDateFromChange}
            maxDate={dateTo || undefined}
            calendarSize="lg"
            className="w-[180px]"
          />
        </div>
        <div>
          <DateInput
            label="Fecha final"
            value={dateTo}
            onChange={onDateToChange}
            minDate={dateFrom || undefined}
            calendarSize="lg"
            className="w-[180px]"
          />
        </div>
        <div>
          <label className={fieldLabel} htmlFor="report-category">
            Categoría
          </label>
          <select
            id="report-category"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            disabled={loadingCategories}
            className={`${dateInputClass} max-w-[220px]`}
          >
            <option value="">
              {loadingCategories ? 'Cargando categorías...' : 'Todas las categorías'}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <button type="button" onClick={onGenerate} disabled={loading} className={primaryBtn}>
          <BarChart3 size={22} />
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-5" aria-labelledby="report-exports-title">
        <div className="mb-4 flex items-start gap-3 border-b border-slate-200 pb-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#03216a] text-white">
            <Download size={20} />
          </div>
          <div>
            <h2 id="report-exports-title" className="text-base font-bold text-slate-900">
              Exportación de documentos
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Descargue el reporte correspondiente al período y categoría seleccionados.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={downloadsDisabled || downloadingPdf}
            className={`${exportBtn} border-red-200 hover:border-red-300 hover:bg-red-50/60`}
          >
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700 transition group-hover:bg-red-200">
              <FileText size={22} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">
                {downloadingPdf ? 'Preparando documento...' : 'Informe en PDF'}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Documento formal listo para impresión
              </span>
            </span>
            <Download size={18} className="ml-auto flex-shrink-0 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={onDownloadCsv}
            disabled={downloadsDisabled || downloadingCsv}
            className={`${exportBtn} border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/60`}
          >
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 transition group-hover:bg-emerald-200">
              <FileSpreadsheet size={22} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-900">
                {downloadingCsv ? 'Preparando datos...' : 'Datos en CSV'}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                Información tabular para análisis académico
              </span>
            </span>
            <Download size={18} className="ml-auto flex-shrink-0 text-slate-400" />
          </button>
        </div>
      </section>
    </div>
  )
}
