import { useEffect, useState } from 'react'
import { externalPersonLabelApi } from '../api/externalPersonLabel'
import { PERSON_TYPE_OPTIONS } from '../types/statistics'

export interface PersonTypeOption {
  value: string
  label: string
}

/**
 * Opciones del filtro «Tipo de persona» de los paneles de asistencia: los cuatro tipos
 * del padrón más las etiquetas de gente externa del catálogo del servidor.
 *
 * El catálogo se pide porque las etiquetas las crea quien administra el comedor. La lista
 * fija que había antes traía `JUBILADO` y `EXTERNO` escritos en el cliente, así que la
 * etiqueta de la jornada deportiva que se creó ayer no se podía elegir — y el servidor ya
 * admite en este filtro cualquier nombre del catálogo.
 *
 * Si la petición falla, quedan los cuatro del padrón y el panel sigue consultando: perder
 * las etiquetas del filtro es un desperfecto, no cargar la pantalla es una avería.
 */
export function usePersonTypeOptions(): PersonTypeOption[] {
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await externalPersonLabelApi.list()
        if (!cancelled) setLabels(result.items.map((l) => l.name))
      } catch {
        // Sin catálogo, el filtro se queda con los cuatro del padrón.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // El rótulo de una etiqueta es su propio nombre: no pasa por ningún mapa del cliente.
  return [...PERSON_TYPE_OPTIONS, ...labels.map((name) => ({ value: name, label: name }))]
}
