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
 * `onEnded` se invoca cuando el sonido **termina** (evento `ended`) o si el archivo
 * da error de carga. No se invoca cuando el autoplay queda bloqueado (no hay
 * reproducción que "termine"), de modo que en ese caso el cierre queda manual.
 */
export function playSound(src: string, volume = 0.6, onEnded?: () => void): void {
  try {
    const audio = new Audio(src)
    audio.volume = Math.max(0, Math.min(1, volume))
    if (onEnded) {
      audio.addEventListener('ended', onEnded, { once: true })
      audio.addEventListener('error', onEnded, { once: true })
    }
    void audio.play().catch(() => {
      /* autoplay bloqueado o error de reproducción: se ignora (cierre manual) */
    })
  } catch {
    /* entorno sin Audio: se ignora */
  }
}
