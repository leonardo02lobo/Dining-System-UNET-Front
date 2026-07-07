import { useEffect, useState } from 'react'
import { sedesApi } from '../api/sedes'
import { Select } from './ui/Select'
import type { Sede } from '../types/sede'

interface SedeSelectorProps {
  value: number | null
  onChange: (id: number | null) => void
  label?: string
  excludeIds?: number[]
  onLoaded?: (sedes: Sede[]) => void
  disabled?: boolean
}

export function SedeSelector({ value, onChange, label = 'Sede', excludeIds, onLoaded, disabled }: SedeSelectorProps) {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const { items } = await sedesApi.list(0, 100)
        const active = items.filter((s) => s.is_active)
        setSedes(active)
        onLoaded?.(active)
      } catch (err: any) {
        setError(err?.message ?? 'No se pudieron cargar las sedes')
      } finally {
        setLoading(false)
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = excludeIds?.length ? sedes.filter((s) => !excludeIds.includes(s.id)) : sedes

  if (loading) {
    return (
      <Select
        label={label}
        options={[]}
        placeholder="Cargando sedes…"
        value=""
        disabled
        fullWidth
        onChange={() => {}}
      />
    )
  }

  if (error) {
    return (
      <Select
        label={label}
        options={[]}
        placeholder="Selecciona una sede"
        value=""
        disabled
        error={error}
        fullWidth
        onChange={() => {}}
      />
    )
  }

  if (visible.length === 0) {
    return (
      <Select
        label={label}
        options={[]}
        placeholder="No hay sedes activas"
        value=""
        disabled
        fullWidth
        onChange={() => {}}
      />
    )
  }

  return (
    <Select
      label={label}
      options={visible.map((s) => ({ value: String(s.id), label: s.name }))}
      placeholder="Selecciona una sede"
      value={value != null ? String(value) : ''}
      disabled={disabled}
      fullWidth
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
    />
  )
}
