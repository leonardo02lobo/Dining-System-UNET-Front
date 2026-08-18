import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

/**
 * fe-gente-externa-registro-manual — el filtro «Tipo de persona» se alimenta del catálogo.
 *
 * La lista fija que había antes traía `JUBILADO` y `EXTERNO` escritos en el cliente, así
 * que la etiqueta de la jornada deportiva creada ayer no se podía elegir — y el servidor
 * ya admite en este filtro cualquier nombre del catálogo.
 */

const list = vi.fn()
vi.mock('../api/externalPersonLabel', () => ({
  externalPersonLabelApi: { list: () => list() },
}))

import { usePersonTypeOptions } from './usePersonTypeOptions'

const PADRON = ['STUDENT', 'TEACHER', 'ADMINISTRATIVE', 'WORKER']

// El cuerpo va entre llaves a propósito: `beforeEach(() => list.mockClear())` devuelve
// el propio mock, y vitest toma lo que devuelve un `beforeEach` como su teardown y lo
// **invoca** al terminar la prueba. Esa llamada extra devuelve la promesa rechazada del
// caso de fallo sin nadie que la espere, y se reporta como error no capturado.
beforeEach(() => { list.mockClear() })

describe('usePersonTypeOptions', () => {
  it('añade las etiquetas del catálogo detrás de los cuatro del padrón', async () => {
    list.mockResolvedValue({
      total: 3,
      items: [
        { id: 1, name: 'Jubilado' },
        { id: 2, name: 'Externo' },
        { id: 3, name: 'Jornada Deportiva' },
      ],
    })

    const { result } = renderHook(() => usePersonTypeOptions())

    await waitFor(() => expect(result.current).toHaveLength(7))
    expect(result.current.slice(0, 4).map((o) => o.value)).toEqual(PADRON)
    expect(result.current.slice(4).map((o) => o.value)).toEqual([
      'Jubilado',
      'Externo',
      'Jornada Deportiva',
    ])
  })

  it('el rótulo de una etiqueta es su propio nombre, sin pasar por ningún mapa', async () => {
    list.mockResolvedValue({ total: 1, items: [{ id: 3, name: 'Jornada Deportiva' }] })

    const { result } = renderHook(() => usePersonTypeOptions())

    await waitFor(() => expect(result.current).toHaveLength(5))
    expect(result.current[4]).toEqual({ value: 'Jornada Deportiva', label: 'Jornada Deportiva' })
  })

  it('si el catálogo no responde, quedan los cuatro del padrón', async () => {
    list.mockImplementation(async () => {
      throw Object.assign(new Error('Servicio no disponible'), { status: 500 })
    })

    const { result } = renderHook(() => usePersonTypeOptions())

    // Perder las etiquetas del filtro es un desperfecto; no cargar la pantalla, una avería.
    await waitFor(() => expect(list).toHaveBeenCalled())
    expect(result.current.map((o) => o.value)).toEqual(PADRON)
  })
})
