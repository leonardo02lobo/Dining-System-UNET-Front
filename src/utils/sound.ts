/**
 * Reproducción de sonidos servidos desde la carpeta pública del frontend.
 *
 * Los archivos viven en `public/sounds/` y Vite los sirve en la ruta `/sounds/…`,
 * de modo que se pueden reproducir por URL sin importarlos en el bundle.
 */

/** Ruta pública del sonido de aviso "ya consumió" (public/sounds/Alerta.mp3). */
export const DUPLICATE_ALERT_SOUND = '/sounds/Alerta.mp3'

/**
 * Reproduce un sonido por su ruta pública. Es *best-effort*: si el navegador
 * bloquea el autoplay, el archivo falta o `Audio` no está disponible, no lanza
 * ninguna excepción (no debe interrumpir el flujo de registro).
 *
 * `onEnded` se invoca cuando el sonido **termina** (evento `ended`), cuando se
 * alcanza `durationMs` o si el archivo da error de carga. No se invoca cuando el
 * autoplay queda bloqueado (no hay reproducción que "termine"), de modo que en ese
 * caso el cierre queda manual.
 *
 * Si se pasa `durationMs`, el audio se reproduce en bucle hasta alcanzar esa
 * duración total (útil para alertas más largas que el propio archivo) y luego se
 * detiene disparando `onEnded`.
 *
 * Devuelve un cancelador que detiene la reproducción sin invocar `onEnded`; sirve
 * para cortar una alerta en curso antes de tiempo (p. ej. al atender al siguiente).
 */
export function playSound(
  src: string,
  volume = 0.6,
  onEnded?: () => void,
  durationMs?: number,
): () => void {
  let done = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let audio: HTMLAudioElement | undefined

  const stop = () => {
    if (done) return
    done = true
    if (timer) clearTimeout(timer)
    if (audio) {
      try { audio.pause() } catch { /* ignore */ }
    }
  }

  // Fin natural / por duración: detiene y notifica una única vez.
  const finish = () => {
    if (done) return
    stop()
    onEnded?.()
  }

  try {
    audio = new Audio(src)
    audio.volume = Math.max(0, Math.min(1, volume))
    audio.addEventListener('error', finish, { once: true })
    if (durationMs && durationMs > 0) {
      audio.loop = true
      timer = setTimeout(finish, durationMs)
    } else if (onEnded) {
      audio.addEventListener('ended', finish, { once: true })
    }
    void audio.play().catch(() => {
      /* autoplay bloqueado o error de reproducción: se ignora (cierre manual) */
    })
  } catch {
    /* entorno sin Audio: se ignora */
  }

  return stop
}

/** Duración objetivo (ms) de la alerta de consumo duplicado (issue #5). */
export const DUPLICATE_ALERT_DURATION_MS = 10_000
