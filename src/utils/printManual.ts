import type { ManualConsumption } from '../types/consumption'
import { userTypeLabel } from './labels'
import { notify } from './toast'

/** Escapa texto para insertarlo de forma segura en el HTML de impresión. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatLongDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString('es-VE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Abre una vista imprimible del listado manual (problemática 27).
 * Las filas se reciben ya ordenadas por cédula (problemática 28).
 */
export function printManualList(date: string, rows: ManualConsumption[]): void {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) {
    notify.error('No se pudo abrir la ventana de impresión. Revisa el bloqueador de ventanas emergentes.')
    return
  }

  const bodyRows = rows
    .map(
      (r, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td>${escapeHtml(r.document_id)}</td>
        <td>${escapeHtml(`${r.first_name} ${r.last_name}`)}</td>
        <td>${escapeHtml(userTypeLabel(r.user_type))}</td>
        <td>${escapeHtml(r.career ?? '—')}</td>
        <td>${formatTime(r.registered_at)}</td>
      </tr>`,
    )
    .join('')

  win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Registro manual - ${escapeHtml(date)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; color: #1e293b; margin: 32px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .subtitle { font-size: 13px; color: #475569; margin: 0 0 20px; text-transform: capitalize; }
    .total { font-size: 12px; color: #64748b; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
    th { background: #f1f5f9; text-transform: uppercase; font-size: 11px; letter-spacing: 0.03em; }
    td.num, th.num { text-align: center; width: 40px; }
    tbody tr:nth-child(even) { background: #f8fafc; }
    .empty { padding: 24px; text-align: center; color: #94a3b8; }
    @media print { body { margin: 12px; } }
  </style>
</head>
<body>
  <h1>Registro Manual del Comedor — UNET</h1>
  <p class="subtitle">${formatLongDate(date)}</p>
  <p class="total">Total de registros: ${rows.length}</p>
  ${
    rows.length === 0
      ? '<p class="empty">No hay registros manuales para esta fecha.</p>'
      : `<table>
    <thead>
      <tr>
        <th class="num">#</th>
        <th>Cédula</th>
        <th>Nombre</th>
        <th>Tipo</th>
        <th>Carrera</th>
        <th>Hora</th>
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>`
  }
</body>
</html>`)

  win.document.close()
  win.focus()
  win.print()
}
