import { describe, expect, it } from 'vitest'
import { createMemoryPhotoStorage } from '../../../tests/helpers/memory-photo-storage'
import { deleteOrphanedPhotos, ORPHAN_MIN_AGE_MS, selectOrphanedFiles } from './orphaned-photos'
import { parsePhotoKey, type PhotoKey } from './photo-key'

const key = (text: string): PhotoKey => {
  const parsed = parsePhotoKey(text)
  if (parsed === null) throw new Error(`Ungültiger Testschlüssel ${text}`)
  return parsed
}
const NOW = new Date('2026-11-22T12:00:00Z')
const ago = (ms: number) => new Date(NOW.getTime() - ms)
const HOUR_MS = 3_600_000

describe('selectOrphanedFiles', () => {
  it('wählt nur Dateien ohne DB-Zeile, die mindestens 24 Stunden alt sind', () => {
    const files = [
      { key: key('alt-verwaist.jpg'), modifiedAt: ago(25 * HOUR_MS) },
      { key: key('genau-24h.jpg'), modifiedAt: ago(ORPHAN_MIN_AGE_MS) },
      { key: key('frisch-verwaist.jpg'), modifiedAt: ago(23 * HOUR_MS) },
      { key: key('alt-referenziert.jpg'), modifiedAt: ago(48 * HOUR_MS) },
    ]

    const orphaned = selectOrphanedFiles({
      files,
      referencedKeys: new Set(['alt-referenziert.jpg']),
      now: NOW,
    })

    expect(orphaned).toEqual(['alt-verwaist.jpg', 'genau-24h.jpg'])
  })
})

describe('deleteOrphanedPhotos', () => {
  it('löscht alte verwaiste Dateien und verschont frische und referenzierte', async () => {
    let clock = ago(30 * HOUR_MS)
    const storage = createMemoryPhotoStorage(() => clock)
    const photo = { data: new Uint8Array([1]), mimeType: 'image/jpeg' } as const
    await storage.save(key('h/alt.jpg'), photo)
    await storage.save(key('h/fest.jpg'), photo)
    clock = ago(HOUR_MS)
    await storage.save(key('h/upload-laeuft.jpg'), photo)

    const deleted = await deleteOrphanedPhotos({
      storage,
      referencedKeys: new Set(['h/fest.jpg']),
      now: NOW,
    })

    expect(deleted).toEqual(['h/alt.jpg'])
    const remaining = (await storage.list()).map((file) => file.key).sort()
    expect(remaining).toEqual(['h/fest.jpg', 'h/upload-laeuft.jpg'])
  })
})
