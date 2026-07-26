import { useState } from 'react'
import { LunchSessionAttendancePanel } from '../components/reports/LunchSessionAttendancePanel'
import { PageHeader } from '../components/ui/PageHeader'
import { PeriodAttendancePanel } from '../components/reports/PeriodAttendancePanel'

type ReportTab = 'periodo' | 'almuerzo'

const TABS: { key: ReportTab; label: string }[] = [
  { key: 'periodo', label: 'Asistencia por Período' },
  { key: 'almuerzo', label: 'Asistencia por Almuerzo' },
]

export function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>('periodo')

  return (
    <div>
      <PageHeader title="Reportes del Comedor" subtitle="Estadísticas de asistencia del comedor" />

      {/* Pestañas: Asistencia por Período | Asistencia por Almuerzo */}
      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-current={tab === t.key ? 'page' : undefined}
            className={[
              'border-b-2 px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'periodo' && <PeriodAttendancePanel />}
      {tab === 'almuerzo' && <LunchSessionAttendancePanel />}
    </div>
  )
}
