import { createHash } from 'node:crypto'
import { mkdtemp, readdir, rm, writeFile, mkdir, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPhotoStorage } from './create-photo-storage'
import { createLocalFileStorage } from './local-file-storage'
import { createMemoryPhotoStorage } from './memory-photo-storage'
import { parsePhotoKey, type PhotoKey } from './photo-key'
import type { PhotoStorage } from './photo-storage'

const key = (text: string): PhotoKey => {
  const parsed = parsePhotoKey(text)
  if (parsed === null) throw new Error(`Ungültiger Testschlüssel ${text}`)
  return parsed
}

const bytes = (text: string) => new TextEncoder().encode(text)
const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

let baseDir: string

beforeEach(async () => {
  baseDir = await mkdtemp(path.join(tmpdir(), 'preposaurus-fotos-'))
})

afterEach(async () => {
  await rm(baseDir, { recursive: true, force: true })
})

const adapters: [string, () => PhotoStorage][] = [
  ['Dateisystem', () => createLocalFileStorage(baseDir)],
  ['In-Memory', () => createMemoryPhotoStorage()],
]

describe.each(adapters)('Foto-Speicher %s', (_name, create) => {
  it('speichert und liest ein Foto, mit Hash, Größe und Typ', async () => {
    const storage = create()
    const stored = await storage.save(key('h1/f1-full.jpg'), {
      data: bytes('jpeg-daten'),
      mimeType: 'image/jpeg',
    })

    expect(stored).toEqual({
      key: 'h1/f1-full.jpg',
      sha256: sha256('jpeg-daten'),
      sizeBytes: 10,
      mimeType: 'image/jpeg',
    })
    expect(await storage.read(key('h1/f1-full.jpg'))).toEqual(bytes('jpeg-daten'))
  })

  it('liefert null für ein fehlendes Foto', async () => {
    expect(await create().read(key('h1/fehlt.jpg'))).toBeNull()
  })

  it('ersetzt einen vorhandenen Stand', async () => {
    const storage = create()
    await storage.save(key('f.jpg'), { data: bytes('alt'), mimeType: 'image/jpeg' })
    await storage.save(key('f.jpg'), { data: bytes('neu'), mimeType: 'image/jpeg' })

    expect(await storage.read(key('f.jpg'))).toEqual(bytes('neu'))
  })

  it('löscht ein Foto, ein zweites Löschen ist kein Fehler', async () => {
    const storage = create()
    await storage.save(key('h1/f1.jpg'), { data: bytes('x'), mimeType: 'image/webp' })

    await storage.delete(key('h1/f1.jpg'))
    await storage.delete(key('h1/f1.jpg'))

    expect(await storage.read(key('h1/f1.jpg'))).toBeNull()
  })

  it('listet alle Dateien mit Änderungszeit', async () => {
    const storage = create()
    await storage.save(key('h1/a.jpg'), { data: bytes('a'), mimeType: 'image/jpeg' })
    await storage.save(key('h2/b.jpg'), { data: bytes('b'), mimeType: 'image/jpeg' })

    const files = await storage.list()

    expect(files.map((file) => file.key).sort()).toEqual(['h1/a.jpg', 'h2/b.jpg'])
    expect(files.every((file) => file.modifiedAt instanceof Date)).toBe(true)
  })

  it('lehnt eine leere Datei ab', async () => {
    await expect(
      create().save(key('leer.jpg'), { data: new Uint8Array(), mimeType: 'image/jpeg' }),
    ).rejects.toThrow('Leere Fotodatei')
  })

  it('gibt Kopien heraus, spätere Änderungen am Puffer wirken nicht', async () => {
    const storage = create()
    const data = bytes('abc')
    await storage.save(key('k.jpg'), { data, mimeType: 'image/jpeg' })
    data[0] = 0

    const read = await storage.read(key('k.jpg'))
    if (read) read[1] = 0

    expect(await storage.read(key('k.jpg'))).toEqual(bytes('abc'))
  })
})

describe('Foto-Speicher Dateisystem', () => {
  it('legt Dateien nur unterhalb des Basisordners ab', async () => {
    await createLocalFileStorage(baseDir).save(key('h1/f.jpg'), {
      data: bytes('x'),
      mimeType: 'image/jpeg',
    })

    expect(await readdir(path.join(baseDir, 'h1'))).toEqual(['f.jpg'])
  })

  it('verweigert einen Schlüssel, der an der Prüfung vorbei aus dem Ordner zeigt', async () => {
    const storage = createLocalFileStorage(baseDir)
    const escaping = '../ausserhalb.jpg' as PhotoKey

    await expect(storage.read(escaping)).rejects.toThrow('außerhalb des Basisordners')
    await expect(storage.delete(escaping)).rejects.toThrow('außerhalb des Basisordners')
    await expect(
      storage.save(escaping, { data: bytes('x'), mimeType: 'image/jpeg' }),
    ).rejects.toThrow('außerhalb des Basisordners')
  })

  it('liefert eine leere Liste, solange der Basisordner fehlt', async () => {
    const storage = createLocalFileStorage(path.join(baseDir, 'gibt-es-nicht'))

    expect(await storage.list()).toEqual([])
  })

  it('übergeht fremde Dateien mit ungültigem Namen und Verknüpfungen', async () => {
    await mkdir(path.join(baseDir, 'h1'))
    await writeFile(path.join(baseDir, 'h1', '.DS_Store'), 'x')
    await writeFile(path.join(baseDir, 'h1', 'gut.jpg'), 'x')
    await symlink('/etc/hosts', path.join(baseDir, 'h1', 'link.jpg'))

    const files = await createLocalFileStorage(baseDir).list()

    expect(files.map((file) => file.key)).toEqual(['h1/gut.jpg'])
  })

  it('gibt andere Dateisystem-Fehler als „fehlt“ weiter', async () => {
    await mkdir(path.join(baseDir, 'ordner'))
    const notADirectory = path.join(baseDir, 'datei')
    await writeFile(notADirectory, 'x')

    await expect(createLocalFileStorage(baseDir).read(key('ordner'))).rejects.toThrow('EISDIR')
    await expect(createLocalFileStorage(notADirectory).list()).rejects.toThrow('ENOTDIR')
  })

  it('hinterlässt nach dem Speichern keine Zwischendatei', async () => {
    await createLocalFileStorage(baseDir).save(key('f.jpg'), {
      data: bytes('x'),
      mimeType: 'image/jpeg',
    })

    expect(await readdir(baseDir)).toEqual(['f.jpg'])
  })

  it('nimmt den Basisordner aus der Konfiguration', async () => {
    const storage = createPhotoStorage({ PHOTO_STORAGE_DIR: baseDir })
    await storage.save(key('f.jpg'), { data: bytes('x'), mimeType: 'image/jpeg' })

    expect(await readdir(baseDir)).toEqual(['f.jpg'])
  })
})
