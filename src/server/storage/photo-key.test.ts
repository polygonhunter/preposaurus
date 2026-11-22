import { describe, expect, it } from 'vitest'
import { buildPhotoKey, parsePhotoKey } from './photo-key'

describe('parsePhotoKey', () => {
  it.each(['haushalt/foto-full.jpg', 'a/b/c/d.jpg', 'foto.jpg', 'A1_b-2.thumb.jpg'])(
    'nimmt den relativen Schlüssel %s an',
    (key) => {
      expect(parsePhotoKey(key)).toBe(key)
    },
  )

  it.each([
    ['leer', ''],
    ['eine Ebene hinauf', '../geheim.jpg'],
    ['hinauf in der Mitte', 'haushalt/../../etc/passwd'],
    ['aktueller Ordner', './foto.jpg'],
    ['absoluter Pfad', '/etc/passwd'],
    ['Backslash (Windows-Pfad)', 'haushalt\\..\\foto.jpg'],
    ['leerer Abschnitt', 'haushalt//foto.jpg'],
    ['Schrägstrich am Ende', 'haushalt/'],
    ['versteckte Datei', 'haushalt/.env'],
    ['Nullbyte', 'foto.jpg\u0000.png'],
    ['Leerzeichen', 'mein foto.jpg'],
    ['URL-kodiert', 'haushalt/%2e%2e/foto.jpg'],
    ['zu tief', 'a/b/c/d/e.jpg'],
    ['zu lang', 'a'.repeat(201)],
  ])('lehnt ab: %s', (_label, key) => {
    expect(parsePhotoKey(key)).toBeNull()
  })
})

describe('buildPhotoKey', () => {
  const householdId = '0b4f6a0e-6a55-4c49-9d4b-2f1c7f0a9b11'
  const photoId = '7d1e2c3b-1111-4a2b-8c9d-0e1f2a3b4c5d'

  it('legt Fotos je Haushalt ab, mit Variante im Dateinamen', () => {
    expect(buildPhotoKey({ householdId, photoId, variant: 'full' })).toBe(
      `${householdId}/${photoId}-full.jpg`,
    )
    expect(buildPhotoKey({ householdId, photoId, variant: 'thumbnail' })).toBe(
      `${householdId}/${photoId}-thumbnail.jpg`,
    )
  })

  it.each([
    { householdId: '..', photoId },
    { householdId, photoId: '../x' },
    { householdId: 'a/b', photoId },
    { householdId: '', photoId },
  ])('ergibt null bei unsicheren IDs (%o)', (ids) => {
    expect(buildPhotoKey({ ...ids, variant: 'full' })).toBeNull()
  })
})
