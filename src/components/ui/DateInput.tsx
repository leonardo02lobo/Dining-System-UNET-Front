import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, X } from 'lucide-react'
import { DatePickerCalendar, type SessionMark } from './DatePickerCalendar'

interface Props {
  value: string            // YYYY-MM-DD or ''
  onChange: (date: string) => void
  label?: string
  placeholder?: string
  minDate?: string
  maxDate?: string
  sessionMarks?: SessionMark[]
  className?: string
  error?: string
}

function formatDisplay(iso: string): string {
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

export function DateInput({
  value,
  onChange,
  label,
  placeholder = 'dd/mm/aaaa',
  minDate,
  maxDate,
  sessionMarks,
  className = '',
  error,
}: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({ top: 0, left: 0 })
  const buttonRef  = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function openCalendar() {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    setPos({ top: rect.bottom + 6, left: rect.left })
    setOpen(true)
  }

  function toggleCalendar() {
    if (open) { setOpen(false) } else { openCalendar() }
  }

  // Close on outside click (handles both trigger and portal content)
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      const t = e.target as Node
      if (buttonRef.current?.contains(t) || dropdownRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Close on scroll — position would be stale after scrolling
  useEffect(() => {
    if (!open) return
    function onScroll() { setOpen(false) }
    window.addEventListener('scroll', onScroll, { capture: true })
    return () => window.removeEventListener('scroll', onScroll, { capture: true })
  }, [open])

  function handleSelect(date: string) {
    onChange(date)
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="select-none text-[13px] font-semibold text-slate-900">
          {label}
        </label>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={toggleCalendar}
        className={[
          'flex h-11 w-full items-center justify-between rounded-md border bg-white px-3.5 text-sm transition',
          'focus:outline-none focus:ring-4',
          error
            ? 'border-red-600 focus:border-red-600 focus:ring-red-500/15'
            : open
            ? 'border-blue-500 ring-4 ring-blue-500/15'
            : 'border-slate-300 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/15',
        ].join(' ')}
      >
        <span className={value ? 'text-slate-900' : 'text-slate-400'}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="rounded p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Limpiar fecha"
            >
              <X size={13} />
            </span>
          )}
          <CalendarDays size={16} className={open ? 'text-blue-500' : 'text-slate-400'} />
        </span>
      </button>

      {error && <span className="text-xs text-red-600">{error}</span>}

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-[9999] drop-shadow-2xl"
        >
          <DatePickerCalendar
            value={value}
            onChange={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            sessionMarks={sessionMarks}
          />
        </div>,
        document.body
      )}
    </div>
  )
}
