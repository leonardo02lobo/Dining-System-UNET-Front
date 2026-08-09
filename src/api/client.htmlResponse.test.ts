/**
 * Regresión: el rewrite `/api/v1/:path*` de `vercel.json` no capturaba la barra
 * final, así que todo GET a un endpoint de colección (`/roles/`, `/users/`,
 * `/careers/`…) caía en el SPA fallback y volvía como `index.html` con status 200.
 * `response.json()` fallaba, el `.catch()` lo sustituía por
 * `{ message: 'Error de conexión con el servidor' }` y, al ser `ok`, el cliente lo
 * devolvía como si fueran los datos: la pantalla reventaba con
 * `.filter is not a function` muy lejos del origen real.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiClient } from './client'

function htmlResponse() {
  return Promise.resolve({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
    json: () => Promise.reject(new SyntaxError('Unexpected token <')),
    blob: () => Promise.resolve(new Blob(['<!doctype html>'])),
  } as unknown as Response)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('client — respuesta HTML con status 200', () => {
  it('lanza en vez de devolver el fallback como datos', async () => {
    vi.stubGlobal('fetch', () => htmlResponse())

    await expect(apiClient.get('/roles/')).rejects.toMatchObject({
      status: 200,
      message: expect.stringContaining('se esperaba JSON'),
    })
  })

  it('lanza también en las descargas de CSV/PDF', async () => {
    vi.stubGlobal('fetch', () => htmlResponse())

    await expect(apiClient.getBlob('/inventory/export/pdf', 'application/pdf')).rejects.toMatchObject({
      status: 200,
      message: expect.stringContaining('se esperaba un archivo'),
    })
  })

  it('acepta un 200 sin content-type (respuestas simuladas en tests)', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([{ id: 1 }]) } as unknown as Response),
    )

    await expect(apiClient.get('/roles/')).resolves.toEqual([{ id: 1 }])
  })
})
