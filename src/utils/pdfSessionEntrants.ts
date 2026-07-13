import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Consumption } from '../types/consumption'
import type { LunchSession } from '../types/lunchSession'
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
}

/**
 * Genera y descarga el PDF de entrantes de una sesión (#4). El backend delega este
 * PDF al frontend (usa branding institucional). Columnas: cédula, apellido, nombre, carrera.
 */
export async function generateSessionEntrantsPdf({
  session,
  entrants,
  onlyAccesoDirecto,
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

  autoTable(doc, {
    startY: 45,
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
