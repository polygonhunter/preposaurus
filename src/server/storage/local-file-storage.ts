// Adapter: Fotos als Dateien im Foto-Volume auf dem NAS. Einzige Datei mit Dateisystem-Zugriff
// auf Fotos. Jeder Pfad entsteht aus Basisordner plus geprüftem Schlüssel.
import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, readdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parsePhotoKey, type PhotoKey } from './photo-key'
import {
  describeStoredPhoto,
  type PhotoFile,
  type PhotoStorage,
  type StoredFileInfo,
} from './photo-storage'

const isNotFound = (error: unknown) =>
  error instanceof Error && 'code' in error && error.code === 'ENOENT'

/**
 * Zweite Sicherung neben parsePhotoKey: Der aufgelöste Pfad muss im Basisordner liegen.
 * Greift auch, falls die Schlüsselprüfung je gelockert wird.
 */
function resolveInside(baseDir: string, key: PhotoKey): string {
  const target = path.resolve(baseDir, key)
  if (!target.startsWith(baseDir + path.sep)) {
    throw new Error('Fotopfad liegt außerhalb des Basisordners.')
  }
  return target
}

/** Erst in eine Nachbardatei schreiben, dann umbenennen: Ein Abbruch hinterlässt nie ein halbes Foto. */
async function writeAtomically(target: string, data: Uint8Array): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true })
  const temporary = `${target}.${randomUUID()}.tmp`
  await writeFile(temporary, data)
  await rename(temporary, target)
}

async function readOrNull(target: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(target))
  } catch (error) {
    if (isNotFound(error)) return null
    throw error
  }
}

async function listFiles(baseDir: string): Promise<StoredFileInfo[]> {
  let entries
  try {
    entries = await readdir(baseDir, { recursive: true, withFileTypes: true })
  } catch (error) {
    if (isNotFound(error)) return []
    throw error
  }
  const files = entries.filter((entry) => entry.isFile())
  const infos = await Promise.all(files.map((entry) => toFileInfo(baseDir, entry)))
  return infos.filter((info) => info !== null)
}

interface DirectoryEntry {
  name: string
  parentPath: string
}

/** Dateien mit Namen, die kein gültiger Schlüssel sind, fasst die App nicht an. */
async function toFileInfo(baseDir: string, entry: DirectoryEntry): Promise<StoredFileInfo | null> {
  const absolute = path.join(entry.parentPath, entry.name)
  const key = parsePhotoKey(path.relative(baseDir, absolute).split(path.sep).join('/'))
  if (key === null) return null
  const { mtime } = await stat(absolute)
  return { key, modifiedAt: mtime }
}

/** Foto-Speicher im Ordner `baseDir` (aus der Konfiguration, siehe create-photo-storage). */
export function createLocalFileStorage(baseDir: string): PhotoStorage {
  const root = path.resolve(baseDir)
  return {
    save: async (key: PhotoKey, file: PhotoFile) => {
      const stored = describeStoredPhoto(key, file)
      await writeAtomically(resolveInside(root, key), file.data)
      return stored
    },
    // Promise.try: Ein ungültiger Pfad wird zur abgelehnten Promise statt zum synchronen Wurf.
    read: (key) => Promise.try(() => readOrNull(resolveInside(root, key))),
    delete: (key) => Promise.try(() => rm(resolveInside(root, key), { force: true })),
    list: () => listFiles(root),
  }
}
