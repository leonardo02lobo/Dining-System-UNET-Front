import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { LunchFormIngredient } from '../types/lunch'
import { logoUnetDataUri, logoDecanatoDataUri } from './pdfLogos'

/**
 * Lunch preparation-list PDF generation (fixes.md #19).
 *
 * Extracted from CreateLunchPage so the page component no longer carries ~140
 * lines of jsPDF layout code.
 */

interface GenerateLunchPdfParams {
  name: string
  date: string
  plateCount: number
  ingredients: LunchFormIngredient[]
}

function formatPdfDate(value: string): string {
  const parsedDate = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsedDate.getTime())) return value || 'Sin fecha'
  return parsedDate.toLocaleDateString('es-VE')
}

function formatQuantity(value: number, unit: string): string {
  return `${Number(value.toFixed(2))} ${unit}`
}

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

/** Build and trigger download of the lunch preparation list PDF. */
export async function generateLunchListPdf({
  name,
  date,
  plateCount,
  ingredients,
}: GenerateLunchPdfParams): Promise<void> {
  const [unetLogo, deanLogo] = await Promise.all([
    loadPdfImage(logoUnetDataUri, 500, 500),
    loadPdfImage(logoDecanatoDataUri, 1000, 500),
  ])

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
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
    doc.text('Sistema de Comedor Universitario - Lista de preparación de almuerzo', 14, pageHeight - 8)
    doc.text(`Página ${pageNumber}`, pageWidth - 14, pageHeight - 8, { align: 'right' })
  }

  drawHeader()
  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('LISTA DE INGREDIENTES DEL ALMUERZO', pageWidth / 2, 44, { align: 'center' })

  doc.setFillColor(248, 250, 252)
  doc.setDrawColor(203, 213, 225)
  doc.roundedRect(14, 50, pageWidth - 28, 25, 2, 2, 'FD')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'bold')
  doc.text('ALMUERZO', 20, 58)
  doc.text('FECHA DE PREPARACIÓN', 105, 58)
  doc.text('CANTIDAD DE PLATOS', 176, 58)
  doc.text('FECHA DE EMISIÓN', 230, 58)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(15, 23, 42)
  doc.text(name, 20, 66, { maxWidth: 76 })
  doc.text(formatPdfDate(date), 105, 66)
  doc.text(plateCount.toLocaleString('es-VE'), 176, 66)
  doc.text(generatedAt, 230, 66, { maxWidth: 50 })

  autoTable(doc, {
    startY: 82,
    margin: { top: 42, right: 14, bottom: 20, left: 14 },
    head: [[
      'N.º',
      'Ingrediente',
      'Categoría',
      `Cantidad calculada (${plateCount} platos)`,
      'Cantidad por plato',
      'Stock disponible',
    ]],
    body: ingredients.map((item, index) => [
      index + 1,
      item.ingredient_name,
      item.category,
      formatQuantity(item.calculated_quantity, item.unit),
      formatQuantity(item.quantity_per_plate, item.unit),
      formatQuantity(item.available_quantity, item.unit),
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
      2: { cellWidth: 45 },
      3: { cellWidth: 48, halign: 'right' },
      4: { cellWidth: 45, halign: 'right' },
      5: { cellWidth: 45, halign: 'right' },
    },
    didDrawPage: ({ pageNumber }) => {
      if (pageNumber > 1) drawHeader()
      drawFooter(pageNumber)
    },
  })

  const filename = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

  doc.save(`lista-almuerzo-${filename || date}-${date}.pdf`)
}
