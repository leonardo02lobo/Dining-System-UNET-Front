import { useEffect, useId, useState } from 'react'
import { careerApi } from '../api/career'
import { Input } from './ui/Input'

interface CareerInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  fullWidth?: boolean
}

/**
 * Campo de carrera con sugerencias del catálogo oficial (`GET /careers/`).
 *
 * La carrera se guarda como texto libre en `beneficiaries`/`external_people`, y los
 * filtros de estadísticas la emparejan contra el catálogo por nombre normalizado.
 * Si alguien la escribe a mano con otra grafía, esa persona desaparece de su
 * carrera y cae en "Sin carrera catalogada". El `datalist` hace que lo normal sea
 * elegir el texto exacto del padrón, sin impedir escribir el departamento de un
 * docente u obrero, que el catálogo no contempla.
 */
export function CareerInput({
  label = 'Carrera / Departamento',
  value,
  onChange,
  placeholder = 'Selecciona o escribe',
  fullWidth = false,
}: CareerInputProps) {
  const listId = useId()
  const [names, setNames] = useState<string[]>([])

  useEffect(() => {
    void (async () => {
      try {
        setNames((await careerApi.list()).map((c) => c.name))
      } catch {
        // Sin catálogo el campo sigue siendo un texto libre normal.
        setNames([])
      }
    })()
  }, [])

  return (
    <>
      <Input
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={listId}
        fullWidth={fullWidth}
      />
      <datalist id={listId}>
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  )
}
