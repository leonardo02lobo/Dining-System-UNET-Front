import { useEffect, useState } from 'react'
import { sedesApi } from '../api/sedes'
import { lunchSessionApi } from '../api/lunchSession'
import { Select } from './ui/Select'
import type { Sede } from '../types/sede'

interface SedeSelectorProps {
  value: number | null
  onChange: (id: number | null) => void
  label?: string
  excludeIds?: number[]
  onLoaded?: (sedes: Sede[]) => void
  disabled?: boolean
  /**
   * `'all'` (por defecto) carga el catálogo completo de sedes activas.
   * `'openable'` carga solo aquellas donde se puede abrir una sesión, que es lo
   * único que el servidor le cuenta a un taquillero: con el listado de sesiones
   * abiertas ya acotado por rol, el complemento no se puede calcular aquí.
   */
  source?: 'all' | 'openable'
  /** `reloadKey` fuerza una recarga; se usa tras un 409 al abrir. */
  reloadKey?: number
}

export function SedeSelector({
  value,
  onChange,
  label = 'Sede',
  excludeIds,
  onLoaded,
  disabled,
  source = 'all',
  reloadKey = 0,
}: SedeSelectorProps) {
  const [sedes, setSedes] = useState<Sede[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const { items } =
          source === 'openable'
            ? await lunchSessionApi.openableSedes()
            : await sedesApi.list(0, 100)
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
  }, [source, reloadKey])

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
        placeholder={
          source === 'openable'
            ? 'No hay sedes disponibles: todas tienen una sesión abierta'
            : 'No hay sedes activas'
        }
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
