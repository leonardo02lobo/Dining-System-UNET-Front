import { Calendar, Download, BarChart3, FileSpreadsheet } from 'lucide-react'
import type { InventoryCategory } from '../../types/inventory'

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
}

const fieldLabel = 'mb-1 block text-[15px] text-black/60'
const dateInputClass =
  'flex h-[38px] w-full max-w-[158px] items-center gap-2 rounded-[5px] border border-black bg-white/90 px-3 text-[15px] text-black outline-none focus:ring-2 focus:ring-[#03216a]/20'

const primaryBtn =
  'inline-flex h-[45px] min-w-[200px] items-center justify-center gap-2.5 rounded-[10px] bg-[#03216a] px-5 text-[15px] font-bold text-white transition hover:bg-[#021a52] disabled:opacity-60'

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
}: ReportDateRangeFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-6">
        <div>
          <label className={fieldLabel} htmlFor="report-date-from">
            Fecha inicial
          </label>
          <div className={dateInputClass}>
            <Calendar size={20} className="flex-shrink-0 text-slate-600" />
            <input
              id="report-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent outline-none"
            />
          </div>
        </div>
        <div>
          <label className={fieldLabel} htmlFor="report-date-to">
            Fecha final
          </label>
          <div className={dateInputClass}>
            <Calendar size={20} className="flex-shrink-0 text-slate-600" />
            <input
              id="report-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="min-w-0 flex-1 border-0 bg-transparent outline-none"
            />
          </div>
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

      <div className="flex flex-wrap gap-4">
        <button type="button" onClick={onGenerate} disabled={loading} className={primaryBtn}>
          <BarChart3 size={22} />
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>
        <button type="button" onClick={onDownloadPdf} disabled={downloadingPdf} className={primaryBtn}>
          <Download size={22} />
          {downloadingPdf ? 'Descargando PDF...' : 'Descargar PDF'}
        </button>
        <button type="button" onClick={onDownloadCsv} disabled={downloadingCsv} className={primaryBtn}>
          <FileSpreadsheet size={22} />
          {downloadingCsv ? 'Descargando CSV...' : 'Descargar CSV'}
        </button>
      </div>
    </div>
  )
}
