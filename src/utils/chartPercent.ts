import type { Chart, ChartOptions } from 'chart.js'

export function formatPercent(value: number, total: number): string {
  if (!total) return '0%'
  return `${((value / total) * 100).toLocaleString('es-VE', { maximumFractionDigits: 1 })}%`
}

export function labelWithPercent(label: string, value: number, total: number): string {
  return `${label} — ${value} (${formatPercent(value, total)})`
}

/**
 * Opciones completas para un PieChart con porcentajes en la leyenda y el tooltip.
 * `PieChart` reemplaza sus defaults por completo al recibir `options`, así que
 * este factory incluye `responsive`/`legend.position` en vez de solo el plugin.
 */
export function piePercentOptions(overrides?: ChartOptions<'pie'>): ChartOptions<'pie'> {
  return {
    responsive: true,
    ...overrides,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          generateLabels: (chart: Chart) => {
            const { data } = chart
            const dataset = data.datasets[0]
            if (!data.labels?.length || !dataset) return []
            const values = dataset.data as number[]
            const total = values.reduce((acc, v) => acc + (v ?? 0), 0)
            const meta = chart.getDatasetMeta(0)
            return data.labels.map((label, i) => {
              const style = meta.controller.getStyle(i, false)
              return {
                text: labelWithPercent(String(label), values[i] ?? 0, total),
                fillStyle: style.backgroundColor,
                strokeStyle: style.borderColor,
                lineWidth: style.borderWidth,
                hidden: !chart.getDataVisibility(i),
                index: i,
              }
            })
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const values = (ctx.dataset.data as number[]) ?? []
            const total = values.reduce((acc, v) => acc + (v ?? 0), 0)
            return labelWithPercent(String(ctx.label), Number(ctx.raw), total)
          },
        },
      },
      ...overrides?.plugins,
    },
  }
}
