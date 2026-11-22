// Adapter: Fotos als Dateien im Foto-Volume auf dem NAS. Einzige Datei mit Dateisystem-Zugriff
// auf Fotos. Jeder Pfad entsteht aus Basisordner plus geprüftem Schlüssel, symbolische Links
// führen nie aus dem Basisordner hinaus (safe-path.ts) und werden beim Auflisten übersprungen.
import 'server-only'
import { randomUUID } from 'node:crypto'
import { lstat, mkdir, open, readdir, readFile, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { parsePhotoKey, type PhotoKey } from './photo-key'
import {
  describeStoredPhoto,
  type PhotoFile,
  type PhotoStorage,
  type StoredFileInfo,
} from './photo-storage'
import { assertRealInside, isNotFound, realpathOrNull, resolveInside } from './safe-path'

/** Schlüssel haben höchstens vier Ebenen, tiefer muss das Auflisten nicht suchen. */
const MAX_DEPTH = 4

/** Prüft jede vorhandene Ebene vom Basisordner bis zum Zielordner, bevor mkdir sie anlegt. */
async function assertFolderChainInside(root: string, folder: string): Promise<void> {
  const segments = path.relative(root, folder).split(path.sep).filter(Boolean)
  for (let depth = 0; depth <= segments.length; depth++) {
    await assertRealInside(root, path.join(root, ...segments.slice(0, depth)))
  }
}

async function writeAndSync(target: string, data: Uint8Array): Promise<void> {
  const handle = await open(target, 'w')
  try {
    await handle.writeFile(data)
    await handle.sync()
  } finally {
    await handle.close()
  }
}

async function syncFolder(folder: string): Promise<void> {
  const handle = await open(folder, 'r')
  try {
    await handle.sync()
  } finally {
    await handle.close()
  }
}

/**
 * Erst in eine Nachbardatei schreiben und auf die Platte zwingen (fsync), dann umbenennen und den
 * Ordner synchronisieren: Auch ein Stromausfall hinterlässt nie ein halbes oder leeres Foto.
 * Bleibt nach einem Fehler eine `.tmp`-Datei liegen, räumt sie das Aufräumen nach 24 Stunden weg.
 */
async function writeAtomically(root: string, target: string, data: Uint8Array): Promise<void> {
  const folder = path.dirname(target)
  await mkdir(root, { recursive: true })
  await assertFolderChainInside(root, folder)
  await mkdir(folder, { recursive: true })
  await assertRealInside(root, target)
  const temporary = `${target}.${randomUUID()}.tmp`
  await writeAndSync(temporary, data)
  await rename(temporary, target)
  await syncFolder(folder)
}

async function readInside(root: string, target: string): Promise<Uint8Array | null> {
  if ((await realpathOrNull(target)) === null) return null
  await assertRealInside(root, target)
  try {
    return new Uint8Array(await readFile(target))
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

async function deleteInside(root: string, target: string): Promise<void> {
  const stats = await lstat(target).catch((error: unknown) => {
    if (isNotFound(error)) return null
    throw error
  })
  if (stats === null) return
  if (stats.isSymbolicLink())
    throw new Error('Symbolische Links im Foto-Volume löscht die App nicht.')
  await assertRealInside(root, path.dirname(target))
  await rm(target, { force: true })
}

/** Folgt keinen symbolischen Links: Verlinkte Ordner und Dateien bleiben unsichtbar. */
async function walk(root: string, folder: string, depth: number): Promise<StoredFileInfo[]> {
  let entries
  try {
    entries = await readdir(folder, { withFileTypes: true })
  } catch (error) {
    if (isNotFound(error)) return []
    throw error
  }
  const nested = entries
    .filter((entry) => entry.isDirectory() && depth < MAX_DEPTH)
    .map((entry) => walk(root, path.join(folder, entry.name), depth + 1))
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => toFileInfo(root, path.join(folder, entry.name)))
  const [lists, infos] = await Promise.all([Promise.all(nested), Promise.all(files)])
  return [...lists.flat(), ...infos.filter((info) => info !== null)]
}

/** Dateien mit Namen, die kein gültiger Schlüssel sind, fasst die App nicht an. */
async function toFileInfo(root: string, absolute: string): Promise<StoredFileInfo | null> {
  const key = parsePhotoKey(path.relative(root, absolute).split(path.sep).join('/'))
  if (key === null) return null
  const { mtime } = await lstat(absolute)
  return { key, modifiedAt: mtime }
}

/** Foto-Speicher im Ordner `baseDir` (aus der Konfiguration, siehe create-photo-storage). */
export function createLocalFileStorage(baseDir: string): PhotoStorage {
  const root = path.resolve(baseDir)
  return {
    save: async (key: PhotoKey, file: PhotoFile) => {
      const stored = describeStoredPhoto(key, file)
      await writeAtomically(root, resolveInside(root, key), file.data)
      return stored
    },
    // Promise.try: Ein ungültiger Pfad wird zur abgelehnten Promise statt zum synchronen Wurf.
    read: (key) => Promise.try(() => readInside(root, resolveInside(root, key))),
    delete: (key) => Promise.try(() => deleteInside(root, resolveInside(root, key))),
    list: () => walk(root, root, 1),
  }
}
