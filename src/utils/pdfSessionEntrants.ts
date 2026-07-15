import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Consumption } from '../types/consumption'
import type { LunchSession } from '../types/lunchSession'
import type { LunchResponse } from '../types/lunch'
import { logoUnetDataUri, logoDecanatoDataUri } from './pdfLogos'

async function loadPdfImage(src: string, maxWidth: number, maxHeight: number): Promise<string> {
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

function formatSessionDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value || 'Sin fecha'
  return parsed.toLocaleDateString('es-VE')
}

interface SessionEntrantsPdfParams {
  session: LunchSession
  entrants: Consumption[]
  onlyAccesoDirecto?: boolean
  /** Menú del día de la sesión; si es null/undefined se imprime "Sin menú registrado" (#2). */
  menu?: LunchResponse | null
}

/**
 * Genera y descarga el PDF de entrantes de una sesión (#4). El backend delega este
 * PDF al frontend (usa branding institucional). Columnas: cédula, apellido, nombre, carrera.
 */
export async function generateSessionEntrantsPdf({
  session,
  entrants,
  onlyAccesoDirecto,
  menu,
}: SessionEntrantsPdfParams): Promise<void> {
  const [unetLogo, deanLogo] = await Promise.all([
    loadPdfImage(logoUnetDataUri, 500, 500),
    loadPdfImage(logoDecanatoDataUri, 1000, 500),
  ])

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()

  doc.addImage(unetLogo, 'PNG', 14, 8, 20, 20)
  doc.addImage(deanLogo, 'PNG', pageWidth - 54, 10, 40, 18)
  doc.setTextColor(3, 33, 106)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('UNIVERSIDAD NACIONAL EXPERIMENTAL DEL TÁCHIRA', pageWidth / 2, 14, { align: 'center' })
  doc.setFontSize(11)
  doc.text('Entrantes al comedor por sesión', pageWidth / 2, 21, { align: 'center' })

  doc.setTextColor(60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const sede = session.sede?.name ? ` · Sede: ${session.sede.name}` : ''
  const filtro = onlyAccesoDirecto ? ' · Solo acceso directo' : ''
  doc.text(`Fecha de la sesión: ${formatSessionDate(session.date)}${sede}${filtro}`, 14, 34)
  doc.text(`Total de entrantes: ${entrants.length}`, 14, 40)

  // ── Sección "Menú del día" (#2) ────────────────────────────────
  doc.setTextColor(3, 33, 106)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Menú del día', 14, 50)

  let entrantsStartY = 56
  doc.setTextColor(60)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  if (!menu) {
    doc.text('Sin menú registrado.', 14, 56)
    entrantsStartY = 63
  } else {
    doc.text(`Platillo: ${menu.name}  ·  Platos: ${menu.platesQuantity}`, 14, 56)
    if (menu.ingredients.length === 0) {
      doc.text('Sin ingredientes registrados.', 14, 62)
      entrantsStartY = 69
    } else {
      autoTable(doc, {
        startY: 60,
        head: [['Ingrediente', 'Cantidad', 'Unidad']],
        body: menu.ingredients.map((ing) => [
          ing.inventoryItem?.name ?? `Insumo #${ing.inventoryItemId}`,
          String(ing.calculatedQuantity),
          ing.unit,
        ]),
        headStyles: { fillColor: [3, 33, 106] },
        styles: { fontSize: 9 },
      })
      const afterMenu = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
      entrantsStartY = (afterMenu?.finalY ?? 60) + 8
    }
  }

  // ── Sección "Entrantes" ────────────────────────────────────────
  doc.setTextColor(3, 33, 106)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Entrantes', 14, entrantsStartY)

  autoTable(doc, {
    startY: entrantsStartY + 4,
    head: [['Cédula', 'Apellido', 'Nombre', 'Carrera']],
    body: entrants.map((e) => [
      e.document_id ?? '—',
      e.last_name ?? '—',
      e.first_name ?? '—',
      e.career ?? '—',
    ]),
    headStyles: { fillColor: [3, 33, 106] },
    styles: { fontSize: 9 },
  })

  doc.save(`entrantes-sesion-${session.date}.pdf`)
}
