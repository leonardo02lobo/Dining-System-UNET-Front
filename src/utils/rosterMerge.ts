import type { StudentBulkItem } from '../types/student'

/**
 * Fusión de los archivos del padrón oficial antes de enviarlos al backend.
 *
 * El padrón viene partido en dos archivos (`Activos.csv` e `Inactivos.csv`) y una
 * misma cédula puede aparecer en ambos cuando el estudiante tiene más de una
 * inscripción (una vigente y otra cerrada). `POST /students/bulk` rechaza la
 * segunda aparición como "cédula repetida dentro del archivo", así que hay que
 * resolver el duplicado aquí y enviar una sola fila por persona.
 */

export interface RosterFile {
  name: string
  items: StudentBulkItem[]
}

export interface RosterConflict {
  cedula: string
  kept: StudentBulkItem
  keptFrom: string
  discarded: { item: StudentBulkItem; from: string }[]
}

export interface RosterMergeResult {
  merged: StudentBulkItem[]
  conflicts: RosterConflict[]
  /** Filas descartadas por duplicado (la suma de descartes de todos los conflictos). */
  duplicates: number
}

/**
 * Fusiona varios archivos en una lista única sin cédulas repetidas.
 *
 * Regla de desempate: **gana la fila activa**. Si un estudiante figura como
 * activo en un archivo e inactivo en otro, sigue inscrito. Entre dos filas del
 * mismo estado gana la del archivo procesado más tarde, de modo que el orden solo
 * importa cuando la data ya es ambigua de por sí.
 *
 * Las filas sin cédula utilizable se conservan tal cual: el backend las reportará
 * como error de fila, que es donde el usuario espera verlas.
 */
export function mergeRosterFiles(files: RosterFile[]): RosterMergeResult {
  const byCedula = new Map<string, { item: StudentBulkItem; from: string }>()
  const conflictsByCedula = new Map<string, RosterConflict>()
  const withoutCedula: StudentBulkItem[] = []
  let duplicates = 0

  for (const file of files) {
    for (const item of file.items) {
      const cedula = item.cedula.trim()
      if (cedula === '') {
        withoutCedula.push(item)
        continue
      }

      const previous = byCedula.get(cedula)
      if (!previous) {
        byCedula.set(cedula, { item, from: file.name })
        continue
      }

      duplicates++
      // Gana el activo; en empate, el más reciente.
      const keepNew = item.is_active || !previous.item.is_active
      const winner = keepNew ? { item, from: file.name } : previous
      const loser = keepNew ? previous : { item, from: file.name }
      byCedula.set(cedula, winner)

      const conflict = conflictsByCedula.get(cedula)
      if (conflict) {
        conflict.discarded.push(loser)
        conflict.kept = winner.item
        conflict.keptFrom = winner.from
      } else {
        conflictsByCedula.set(cedula, {
          cedula,
          kept: winner.item,
          keptFrom: winner.from,
          discarded: [loser],
        })
      }
    }
  }

  return {
    merged: [...[...byCedula.values()].map((e) => e.item), ...withoutCedula],
    conflicts: [...conflictsByCedula.values()],
    duplicates,
  }
}
