/**
 * Reproducción de sonidos servidos desde la carpeta pública del frontend.
 *
 * Los archivos viven en `public/sounds/` y Vite los sirve en la ruta `/sounds/…`,
 * de modo que se pueden reproducir por URL sin importarlos en el bundle.
 */

/** Ruta pública del sonido de aviso "ya consumió" (public/sounds/Alerta.mp3). */
export const DUPLICATE_ALERT_SOUND = '/sounds/Alerta.mp3'

export interface PlaySoundOptions {
  /** Volumen 0..1 (por defecto 0.6). */
  volume?: number
  /** Se invoca cuando el sonido termina (natural, por duración o por error). */
  onEnded?: () => void
  /**
   * Duración total deseada en milisegundos. Si el archivo es más corto, se
   * repite en bucle (`loop`) hasta alcanzarla; llegado el tope se detiene y se
   * dispara `onEnded`. Si se omite, suena una sola vez (comportamiento clásico).
   */
  durationMs?: number
}

/**
 * Reproduce un sonido por su ruta pública. Es *best-effort*: si el navegador
 * bloquea el autoplay, el archivo falta o `Audio` no está disponible, no lanza
 * ninguna excepción (no debe interrumpir el flujo de registro).
 *
 * `onEnded` se invoca cuando el sonido **termina** (evento `ended`, tope de
 * `durationMs`, o error de carga). No se invoca cuando el autoplay queda
 * bloqueado (no hay reproducción que "termine"), de modo que en ese caso el
 * cierre queda manual.
 *
 * Devuelve una función para **cancelar** la reproducción en curso (detiene el
 * audio y libera timers) sin disparar `onEnded`; útil para no acumular
 * instancias de `Audio` si se lanza otra alerta antes de que termine.
 */
export function playSound(src: string, options: PlaySoundOptions = {}): () => void {
  const { volume = 0.6, onEnded, durationMs } = options
  let stopTimer: ReturnType<typeof setTimeout> | null = null
  let cancelled = false

  try {
    const audio = new Audio(src)
    audio.volume = Math.max(0, Math.min(1, volume))
    if (durationMs && durationMs > 0) audio.loop = true

    const finish = () => {
      if (cancelled) return
      cancelled = true
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null }
      audio.loop = false
      audio.pause()
      onEnded?.()
    }

    if (durationMs && durationMs > 0) {
      // En modo bucle no se emite `ended`; el fin lo marca el temporizador.
      stopTimer = setTimeout(finish, durationMs)
      audio.addEventListener('error', finish, { once: true })
    } else if (onEnded) {
      audio.addEventListener('ended', onEnded, { once: true })
      audio.addEventListener('error', onEnded, { once: true })
    }

    void audio.play().catch(() => {
      /* autoplay bloqueado o error de reproducción: se ignora (cierre manual) */
    })

    return () => {
      if (cancelled) return
      cancelled = true
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null }
      audio.loop = false
      audio.pause()
    }
  } catch {
    /* entorno sin Audio: se ignora */
    return () => {}
  }
}
