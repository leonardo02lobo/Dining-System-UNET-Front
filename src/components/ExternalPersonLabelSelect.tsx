import { useEffect, useState } from 'react'
import { externalPersonLabelApi } from '../api/externalPersonLabel'
import { errorMessage } from '../utils/apiErrors'
import type { ExternalPersonLabel } from '../types/externalPersonLabel'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

/** Valor centinela de la última opción del desplegable. */
const CREATE = '__create__'

interface Props {
  /** Id explícito: el filtro de la pantalla comparte rótulo con este campo. */
  id?: string
  label?: string
  value: number | null
  onChange: (labelId: number | null) => void
  /** Se avisa al crear para que la pantalla refresque su propio filtro de etiquetas. */
  onLabelsChanged?: (labels: ExternalPersonLabel[]) => void
  error?: string
  fullWidth?: boolean
}

/**
 * Campo de etiqueta de gente externa: desplegable cerrado sobre el catálogo, con una
 * opción final que la crea sin salir del formulario.
 *
 * No se usa el patrón de `CareerInput` (`input` + `datalist`) a propósito. La carrera
 * es texto libre con sugerencias, y escribirla distinto solo afecta a esa persona. La
 * etiqueta es una clave foránea: dos grafías del mismo grupo lo parten en dos y la
 * baja en lote deja fuera a la mitad de la gente, que es justo lo que la etiqueta
 * existe para evitar.
 */
export function ExternalPersonLabelSelect({
  id,
  label = 'Etiqueta',
  value,
  onChange,
  onLabelsChanged,
  error,
  fullWidth = false,
}: Props) {
  const [labels, setLabels] = useState<ExternalPersonLabel[]>([])
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')

  async function loadLabels() {
    try {
      const res = await externalPersonLabelApi.list()
      setLabels(res.items)
      onLabelsChanged?.(res.items)
      return res.items
    } catch {
      // Sin catálogo el campo queda vacío y el formulario no deja guardar, que es
      // preferible a inventar una etiqueta que el servidor no conoce.
      setLabels([])
      return []
    }
  }

  useEffect(() => {
    void loadLabels()
    // Solo al montar: el catálogo se refresca desde `handleCreate`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startCreating() {
    setDraft('')
    setCreateError('')
    setCreating(true)
  }

  function cancelCreating() {
    setCreating(false)
    setCreateError('')
  }

  async function handleCreate() {
    const name = draft.trim()
    if (!name) {
      setCreateError('Escribe el nombre de la etiqueta.')
      return
    }
    setSaving(true)
    setCreateError('')
    try {
      const created = await externalPersonLabelApi.create({ name })
      await loadLabels()
      onChange(created.id)
      setCreating(false)
    } catch (err: any) {
      // Un 409 por nombre repetido no es un error que mostrar: elegirla es lo que la
      // persona quería. Se selecciona la que ya existía y se sigue.
      const existing = (await loadLabels()).find(
        (l) => l.name.trim().toLowerCase() === name.toLowerCase(),
      )
      if (err?.status === 409 && existing) {
        onChange(existing.id)
        setCreating(false)
        return
      }
      setCreateError(errorMessage(err, {}, 'No se pudo crear la etiqueta.'))
    } finally {
      setSaving(false)
    }
  }

  if (creating) {
    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        <Input
          id={id ? `${id}-new` : undefined}
          label={`${label} nueva`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ej. Congreso Julio 2026"
          error={createError || undefined}
          fullWidth
          autoFocus
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => void handleCreate()} disabled={saving}>
            {saving ? 'Creando…' : 'Crear'}
          </Button>
          <Button size="sm" variant="secondary" onClick={cancelCreating} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Select
      id={id}
      label={label}
      value={value == null ? '' : String(value)}
      onChange={(e) => {
        if (e.target.value === CREATE) {
          startCreating()
          return
        }
        onChange(e.target.value ? Number(e.target.value) : null)
      }}
      placeholder="Selecciona una etiqueta"
      error={error}
      fullWidth={fullWidth}
      options={[
        ...labels.map((l) => ({ value: String(l.id), label: l.name })),
        { value: CREATE, label: '+ Nueva etiqueta…' },
      ]}
    />
  )
}
