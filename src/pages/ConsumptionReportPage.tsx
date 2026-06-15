import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ConsumptionReportTable } from '../components/reports/ConsumptionReportTable'
import { ReportChartsPanel } from '../components/reports/ReportChartsPanel'
import { ReportDateRangeFilters } from '../components/reports/ReportDateRangeFilters'
import { reportsApi } from '../api/reports'
import { inventoryApi } from '../api/inventory'
import type { ConsumptionReportItem } from '../types/report'
import type { InventoryCategory } from '../types/inventory'
import type {
  CategoryConsumption,
  ConsumptionReportRow,
  SupplyConsumption,
} from '../types/consumptionReport'
import { notify } from '../utils/toast'

const CATEGORY_COLORS = ['#03216a', '#34c759', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9']

async function loadImageData(src: string, maxWidth: number, maxHeight: number) {
  const image = new Image()
  image.src = src
  await image.decode()

  const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/png')
}

function toIsoDate(daysAgo = 0) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

function formatDisplayDate(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value || 'Sin fecha'

  return date.toLocaleDateString('es-VE')
}

function toReportRow(item: ConsumptionReportItem, index: number): ConsumptionReportRow {
  return {
    id: item.itemId || index,
    supply_name: item.itemName,
    category: item.categoryName,
    consumed_amount: item.quantityConsumed,
    unit: item.unit,
    date_from: formatDisplayDate(item.period.fromDate),
    date_to: formatDisplayDate(item.period.toDate),
  }
}

function toCategoryConsumption(items: ConsumptionReportItem[]): CategoryConsumption[] {
  const totals = new Map<string, number>()
  items.forEach((item) => {
    totals.set(item.categoryName, (totals.get(item.categoryName) ?? 0) + item.quantityConsumed)
  })

  return Array.from(totals.entries()).map(([category, total], index) => ({
    category,
    total,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))
}

function toSupplyConsumption(items: ConsumptionReportItem[]): SupplyConsumption[] {
  return items.map((item) => ({
    supply_name: item.itemName,
    total: item.quantityConsumed,
    unit: item.unit,
  }))
}

export function ConsumptionReportPage() {
  const [dateFrom, setDateFrom] = useState(toIsoDate(80))
  const [dateTo, setDateTo] = useState(toIsoDate(0))
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [items, setItems] = useState<ConsumptionReportItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [downloadingCsv, setDownloadingCsv] = useState(false)
  const hasGeneratedReport = items !== null && items.length > 0
  const downloadsDisabled = !dateFrom || !dateTo || dateFrom > dateTo || !hasGeneratedReport

  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true)
      try {
        setCategories(await inventoryApi.listCategories())
      } catch (err) {
        notify.error(err)
      } finally {
        setLoadingCategories(false)
      }
    }

    void loadCategories()
  }, [])

  function hasValidDateRange() {
    if (!dateFrom || !dateTo) {
      notify.info('Selecciona la fecha inicial y final.')
      return false
    }
    if (dateFrom > dateTo) {
      notify.info('La fecha inicial no puede ser mayor que la final.')
      return false
    }

    return true
  }

  async function handleGenerate() {
    if (!hasValidDateRange()) return

    setItems(null)
    setLoading(true)
    try {
      const data = await reportsApi.consumptionReports({
        fromDate: dateFrom,
        toDate: dateTo,
        categoryId: categoryId ? Number(categoryId) : undefined,
      })
      setItems(data)
      notify.success(`Reporte generado con ${data.length} insumo(s).`)
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  }

  function downloadBlob(file: Blob, filename: string) {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  async function handleDownloadPdf() {
    if (downloadsDisabled || !hasValidDateRange()) return

    setDownloadingPdf(true)
    try {
      const reportItems = await reportsApi.consumptionReports({
        fromDate: dateFrom,
        toDate: dateTo,
        categoryId: categoryId ? Number(categoryId) : undefined,
      })

      if (reportItems.length === 0) {
        notify.info('No hay datos disponibles para generar el documento PDF.')
        return
      }

      const [unetLogo, deanLogo] = await Promise.all([
        loadImageData('/assets/logo-unet.png', 500, 500),
        loadImageData('/assets/LOGO DECANATO.png', 1000, 500),
      ])

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const selectedCategory = categories.find((category) => String(category.id) === categoryId)
      const generatedAt = new Date().toLocaleString('es-VE', {
        dateStyle: 'long',
        timeStyle: 'short',
      })

      function drawHeader() {
        doc.addImage(unetLogo, 'PNG', 14, 8, 22, 22)
        doc.addImage(deanLogo, 'PNG', pageWidth - 58, 10, 44, 20)

        doc.setTextColor(3, 33, 106)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TÁCHIRA', pageWidth / 2, 13, { align: 'center' })
        doc.setFontSize(10)
        doc.text('VICERRECTORADO ACADÉMICO', pageWidth / 2, 18, { align: 'center' })
        doc.text('DECANATO DE DESARROLLO ESTUDIANTIL', pageWidth / 2, 23, { align: 'center' })

        doc.setDrawColor(3, 33, 106)
        doc.setLineWidth(0.6)
        doc.line(14, 34, pageWidth - 14, 34)
      }

      function drawFooter(pageNumber: number) {
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.3)
        doc.line(14, pageHeight - 13, pageWidth - 14, pageHeight - 13)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text('Sistema de Comedor Universitario - Documento de uso institucional', 14, pageHeight - 8)
        doc.text(`Página ${pageNumber}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
      }

      drawHeader()
      doc.setTextColor(15, 23, 42)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(17)
      doc.text('REPORTE DE CONSUMO DE INSUMOS', pageWidth / 2, 44, { align: 'center' })

      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(203, 213, 225)
      doc.roundedRect(14, 50, pageWidth - 28, 25, 2, 2, 'FD')
      doc.setFontSize(9)
      doc.setTextColor(71, 85, 105)
      doc.setFont('helvetica', 'bold')
      doc.text('PERÍODO DEL REPORTE', 20, 58)
      doc.text('CATEGORÍA', 108, 58)
      doc.text('FECHA DE EMISIÓN', 190, 58)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(15, 23, 42)
      doc.text(`${formatDisplayDate(dateFrom)} al ${formatDisplayDate(dateTo)}`, 20, 66)
      doc.text(selectedCategory?.name ?? 'Todas las categorías', 108, 66)
      doc.text(generatedAt, 190, 66)

      autoTable(doc, {
        startY: 82,
        margin: { top: 42, right: 14, bottom: 20, left: 14 },
        head: [['N.º', 'Insumo', 'Categoría', 'Cantidad consumida', 'Unidad', 'Período']],
        body: reportItems.map((item, index) => [
          index + 1,
          item.itemName,
          item.categoryName,
          Number(item.quantityConsumed).toLocaleString('es-VE', { maximumFractionDigits: 2 }),
          item.unit,
          `${formatDisplayDate(item.period.fromDate)} - ${formatDisplayDate(item.period.toDate)}`,
        ]),
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 9,
          cellPadding: 3,
          lineColor: [203, 213, 225],
          lineWidth: 0.2,
          textColor: [30, 41, 59],
          valign: 'middle',
        },
        headStyles: {
          fillColor: [3, 33, 106],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { cellWidth: 14, halign: 'center' },
          1: { cellWidth: 58 },
          2: { cellWidth: 48 },
          3: { cellWidth: 38, halign: 'right' },
          4: { cellWidth: 24, halign: 'center' },
          5: { cellWidth: 60, halign: 'center' },
        },
        didDrawPage: ({ pageNumber }) => {
          if (pageNumber > 1) drawHeader()
          drawFooter(pageNumber)
        },
      })

      const categorySuffix = categoryId ? `-categoria-${categoryId}` : ''
      doc.save(`reporte-consumo-${dateFrom}-${dateTo}${categorySuffix}.pdf`)
      notify.success('Reporte PDF descargado correctamente.')
    } catch (err) {
      notify.error(err)
    } finally {
      setDownloadingPdf(false)
    }
  }

  async function handleDownloadCsv() {
    if (downloadsDisabled || !hasValidDateRange()) return

    setDownloadingCsv(true)
    try {
      const csv = await reportsApi.exportConsumptionReportCsv({
        fromDate: dateFrom,
        toDate: dateTo,
        categoryId: categoryId ? Number(categoryId) : undefined,
      })
      const categorySuffix = categoryId ? `-categoria-${categoryId}` : ''
      downloadBlob(csv, `reporte-consumo-${dateFrom}-${dateTo}${categorySuffix}.csv`)
      notify.success('Reporte CSV descargado correctamente.')
    } catch (err) {
      notify.error(err)
    } finally {
      setDownloadingCsv(false)
    }
  }

  const rows = useMemo(() => (items ?? []).map(toReportRow), [items])
  const categoryData = useMemo(() => toCategoryConsumption(items ?? []), [items])
  const supplyData = useMemo(() => toSupplyConsumption(items ?? []), [items])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-black sm:text-4xl">Reportes de consumo</h1>

      <ReportDateRangeFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        categoryId={categoryId}
        categories={categories}
        onDateFromChange={(value) => {
          setDateFrom(value)
          setItems(null)
        }}
        onDateToChange={(value) => {
          setDateTo(value)
          setItems(null)
        }}
        onCategoryChange={(value) => {
          setCategoryId(value)
          setItems(null)
        }}
        onGenerate={handleGenerate}
        onDownloadPdf={handleDownloadPdf}
        onDownloadCsv={handleDownloadCsv}
        loading={loading}
        downloadingPdf={downloadingPdf}
        downloadingCsv={downloadingCsv}
        loadingCategories={loadingCategories}
        downloadsDisabled={downloadsDisabled}
      />

      {items !== null ? (
        <ConsumptionReportTable rows={rows} />
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
          Selecciona un rango de fechas y presiona <strong>Generar Reporte</strong>.
        </div>
      )}

      {items !== null && rows.length > 0 && (
        <ReportChartsPanel categoryData={categoryData} supplyData={supplyData} />
      )}
    </div>
  )
}
