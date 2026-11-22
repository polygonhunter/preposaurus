// Symbolische Links im Foto-Volume: Nichts darf über einen Link außerhalb des Basisordners
// geschrieben, gelesen, aufgelistet oder gelöscht werden.
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createLocalFileStorage } from './local-file-storage'
import { deleteOrphanedPhotos } from './orphaned-photos'
import { parsePhotoKey, type PhotoKey } from './photo-key'

const key = (text: string): PhotoKey => {
  const parsed = parsePhotoKey(text)
  if (parsed === null) throw new Error(`Ungültiger Testschlüssel ${text}`)
  return parsed
}

const photo = { data: new TextEncoder().encode('x'), mimeType: 'image/jpeg' } as const
const LONG_AGO = new Date('2020-01-01T00:00:00Z')

let sandbox: string
let base: string
let outside: string

beforeEach(async () => {
  sandbox = await mkdtemp(path.join(tmpdir(), 'preposaurus-links-'))
  base = path.join(sandbox, 'fotos')
  outside = path.join(sandbox, 'ausserhalb')
  await mkdir(base)
  await mkdir(outside)
  await writeFile(path.join(outside, 'geheim.jpg'), 'geheim')
  await utimes(path.join(outside, 'geheim.jpg'), LONG_AGO, LONG_AGO)
})

afterEach(async () => {
  await rm(sandbox, { recursive: true, force: true })
})

describe('Foto-Speicher Dateisystem mit symbolischen Links', () => {
  it('schreibt nicht über einen verlinkten Ordner nach außerhalb', async () => {
    await symlink(outside, path.join(base, 'hh'))
    const storage = createLocalFileStorage(base)

    await expect(storage.save(key('hh/neu.jpg'), photo)).rejects.toThrow('außerhalb')
    await expect(storage.save(key('hh/sub/neu.jpg'), photo)).rejects.toThrow('außerhalb')
    expect((await readdir(outside)).sort()).toEqual(['geheim.jpg'])
  })

  it('liest nicht über einen verlinkten Ordner oder eine verlinkte Datei', async () => {
    await symlink(outside, path.join(base, 'hh'))
    await symlink(path.join(outside, 'geheim.jpg'), path.join(base, 'link.jpg'))
    const storage = createLocalFileStorage(base)

    await expect(storage.read(key('hh/geheim.jpg'))).rejects.toThrow('außerhalb')
    await expect(storage.read(key('link.jpg'))).rejects.toThrow('außerhalb')
  })

  it('löscht weder über einen verlinkten Ordner noch einen Link selbst', async () => {
    await symlink(outside, path.join(base, 'hh'))
    await symlink(path.join(outside, 'geheim.jpg'), path.join(base, 'link.jpg'))
    const storage = createLocalFileStorage(base)

    await expect(storage.delete(key('hh/geheim.jpg'))).rejects.toThrow('außerhalb')
    await expect(storage.delete(key('link.jpg'))).rejects.toThrow('Symbolische Links')
    expect(await readFile(path.join(outside, 'geheim.jpg'), 'utf8')).toBe('geheim')
  })

  it('listet und räumt keine Dateien hinter Links auf, auch alte nicht', async () => {
    await symlink(outside, path.join(base, 'hh'))
    await symlink(path.join(outside, 'geheim.jpg'), path.join(base, 'link.jpg'))
    await mkdir(path.join(base, 'echt'))
    await writeFile(path.join(base, 'echt', 'alt.jpg'), 'x')
    await utimes(path.join(base, 'echt', 'alt.jpg'), LONG_AGO, LONG_AGO)
    const storage = createLocalFileStorage(base)

    expect((await storage.list()).map((file) => file.key)).toEqual(['echt/alt.jpg'])
    const deleted = await deleteOrphanedPhotos({
      storage,
      referencedKeys: new Set(),
      now: new Date(),
    })

    expect(deleted).toEqual(['echt/alt.jpg'])
    expect(await readdir(outside)).toEqual(['geheim.jpg'])
    expect(await readdir(base)).toEqual(expect.arrayContaining(['hh', 'link.jpg']))
  })

  it('arbeitet normal, wenn der Basisordner selbst ein Link ist (z. B. NAS-Freigabe)', async () => {
    const linkedBase = path.join(sandbox, 'fotos-link')
    await symlink(base, linkedBase)
    const storage = createLocalFileStorage(linkedBase)

    await storage.save(key('hh/f.jpg'), photo)

    expect(await storage.read(key('hh/f.jpg'))).toEqual(photo.data)
    expect((await storage.list()).map((file) => file.key)).toEqual(['hh/f.jpg'])
    await storage.delete(key('hh/f.jpg'))
    expect(await storage.read(key('hh/f.jpg'))).toBeNull()
  })

  it('legt den Basisordner beim ersten Speichern an', async () => {
    const storage = createLocalFileStorage(path.join(sandbox, 'neu'))

    await storage.save(key('hh/f.jpg'), photo)

    expect(await readdir(path.join(sandbox, 'neu', 'hh'))).toEqual(['f.jpg'])
  })
})
