import { describe, expect, it } from 'vitest'
import type { PhotoKey } from '@/server/storage/photo-key'
import type { DeleteEntryRequest } from '../schemas/requests'
import { deleteEntry } from './delete-entry'
import type { EntryEraser } from './entry-eraser'

// Frei gewählte Testdaten. Die Reihenfolge der Schritte landet in einem gemeinsamen Protokoll.
const householdId = '11111111-1111-4111-8111-111111111111'
const photoId = '22222222-2222-4222-8222-222222222222'
const productId = '33333333-3333-4333-8333-333333333333'
const target: DeleteEntryRequest = { kind: 'product', productId }

type ErasedRows = Awaited<ReturnType<EntryEraser['eraseRows']>>

function setup(rows: ErasedRows, failingKeys: readonly string[] = []) {
  const log: string[] = []
  const eraser = {
    eraseRows: (household: string, request: DeleteEntryRequest) => {
      log.push(`db:${household}:${request.kind}`)
      return Promise.resolve(rows)
    },
  }
  const storage = {
    delete: (key: PhotoKey) => {
      log.push(`datei:${key}`)
      return failingKeys.includes(key)
        ? Promise.reject(new Error('Datei gesperrt'))
        : Promise.resolve()
    },
  }
  return { log, deps: { eraser, storage } }
}

describe('deleteEntry (Fehlerfassung endgültig löschen, #50)', () => {
  it('löscht erst die DB-Zeilen, dann beide Dateien jedes Fotos', async () => {
    const { log, deps } = setup({
      photos: [{ id: photoId, householdId }],
      isProductRemoved: true,
    })

    const result = await deleteEntry(deps, { householdId, target })

    expect(result).toEqual({ ok: true, value: { isProductRemoved: true, leftoverPhotoIds: [] } })
    expect(log).toEqual([
      `db:${householdId}:product`,
      `datei:${householdId}/${photoId}-full.jpg`,
      `datei:${householdId}/${photoId}-thumbnail.jpg`,
    ])
  })

  it('meldet Fotos, deren Dateien liegen blieben, ohne zu scheitern', async () => {
    const { deps } = setup({ photos: [{ id: photoId, householdId }], isProductRemoved: false }, [
      `${householdId}/${photoId}-thumbnail.jpg`,
    ])

    const result = await deleteEntry(deps, { householdId, target })

    expect(result).toEqual({
      ok: true,
      value: { isProductRemoved: false, leftoverPhotoIds: [photoId] },
    })
  })

  it('rührt ohne Treffer im Haushalt keine Datei an', async () => {
    const { log, deps } = setup(null)

    const result = await deleteEntry(deps, { householdId, target })

    expect(result).toEqual({ ok: false, error: { kind: 'not-found' } })
    expect(log).toEqual([`db:${householdId}:product`])
  })
})
