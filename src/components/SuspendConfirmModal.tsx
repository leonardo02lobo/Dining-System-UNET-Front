import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { AlertCircle } from 'lucide-react'
import type { Student } from '../types/user'
import { Button } from './ui/Button'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  student: Student
  observations: string
  loading: boolean
}

const rows = (student: Student, observations: string) => [
  { label: 'Documento', value: student.cedula     },
  { label: 'Nombre',    value: student.name       },
  { label: 'Carrera',   value: student.career     },
  { label: 'Motivo',    value: observations       },
]

export function SuspendConfirmModal({ open, onClose, onConfirm, student, observations, loading }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-5 rounded-2xl bg-white px-10 py-10 shadow-xl">

        {/* Icon */}
        <AlertCircle size={64} strokeWidth={1.5} className="text-[#03216A]" />

        {/* Heading */}
        <h2 className="text-3xl font-bold text-slate-900">Confirmar suspension</h2>

        {/* Description */}
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-800">
            ¿Estas seguro de suspender a este alumno?
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Esta accion cambiara el estatus del estudiante a suspendido y
            restringira su acceso al sistema de comedor
          </p>
        </div>

        {/* Info card */}
        <div className="w-full overflow-hidden rounded-xl bg-slate-100">
          {rows(student, observations).map(({ label, value }, i, arr) => (
            <div
              key={label}
              className={[
                'flex items-start gap-4 px-5 py-3',
                i < arr.length - 1 ? 'border-b border-slate-200' : '',
              ].join(' ')}
            >
              <span className="w-28 flex-shrink-0 text-sm text-slate-600">{label}:</span>
              <span className="text-sm text-slate-500">{value || '—'}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex w-full justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full border border-slate-300 px-8 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <Button
            variant="primary"
            loading={loading}
            onClick={onConfirm}
            className="rounded-full !bg-[#03216A] px-8 hover:!bg-[#03216A]/90"
          >
            Confirmar suspension
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
