// Pfadprüfung für den Dateisystem-Adapter. Zwei Stufen: Der Schlüssel muss textuell im
// Basisordner bleiben, und der echte Pfad (realpath, nach Auflösen aller symbolischen Links)
// muss im echten Basisordner liegen. Sonst könnte ein verlinkter Ordner im Foto-Volume
// Schreiben, Lesen oder Löschen außerhalb erlauben.
import 'server-only'
import { realpath } from 'node:fs/promises'
import path from 'node:path'
import type { PhotoKey } from './photo-key'

const OUTSIDE = 'Fotopfad liegt außerhalb des Basisordners.'

export const isNotFound = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT'

const isInside = (base: string, target: string) =>
  target === base || target.startsWith(base + path.sep)

/** Textuelle Prüfung: Basisordner plus Schlüssel, ohne das Dateisystem zu fragen. */
export function resolveInside(base: string, key: PhotoKey): string {
  const target = path.resolve(base, key)
  if (!isInside(base, target)) throw new Error(OUTSIDE)
  return target
}

/** Echter Pfad oder null, wenn er fehlt. */
export async function realpathOrNull(target: string): Promise<string | null> {
  try {
    return await realpath(target)
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

/** Wirft, wenn der vorhandene Pfad über einen Link aus dem echten Basisordner hinausführt. */
export async function assertRealInside(base: string, target: string): Promise<void> {
  const [realBase, realTarget] = await Promise.all([realpath(base), realpathOrNull(target)])
  if (realTarget !== null && !isInside(realBase, realTarget)) throw new Error(OUTSIDE)
}
