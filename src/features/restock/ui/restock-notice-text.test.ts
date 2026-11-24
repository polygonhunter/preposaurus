import { describe, expect, it } from 'vitest'
import { restockAnnouncement, restockNoticeMessage } from './restock-notice-text'

// Frei gewählte Testdaten.
const entry = { id: 'e1', label: 'Knäckebrot' }
const removedItem = {
  id: 'r1',
  label: 'Zwieback',
  source: 'manuell',
  productId: null,
  isDone: false,
  doneAt: null,
  createdAt: '2026-11-24T08:00:00.000Z',
} as const

describe('restockNoticeMessage', () => {
  it('nennt den Eintrag je nach Handlung', () => {
    expect(
      restockNoticeMessage({ kind: 'checked', entry: { ...entry, captureTarget: null } }),
    ).toBe('Knäckebrot abgehakt.')
    expect(restockNoticeMessage({ kind: 'removed', item: removedItem })).toBe('Zwieback entfernt.')
    expect(restockNoticeMessage({ kind: 'listed', entry })).toBe(
      'Knäckebrot steht jetzt auf der Liste.',
    )
    expect(restockNoticeMessage({ kind: 'hidden', entry })).toBe('Knäckebrot ausgeblendet.')
    expect(restockNoticeMessage({ kind: 'error', message: 'Das ging nicht.' })).toBe(
      'Das ging nicht.',
    )
  })
})

describe('restockAnnouncement', () => {
  it('sagt nichts an, solange keine Meldung steht', () => {
    expect(restockAnnouncement(null)).toBeNull()
  })

  it('sagt die Rückgängig-Zeile höflich an, mit einem Schlüssel je Handlung und Eintrag', () => {
    expect(restockAnnouncement({ kind: 'hidden', entry })).toEqual({
      key: 'hidden-e1',
      message: 'Knäckebrot ausgeblendet.',
      isError: false,
    })
    expect(restockAnnouncement({ kind: 'removed', item: removedItem })?.key).toBe('removed-r1')
  })

  it('sagt einen Fehler sofort an', () => {
    expect(restockAnnouncement({ kind: 'error', message: 'Das ging nicht.' })).toEqual({
      key: 'error',
      message: 'Das ging nicht.',
      isError: true,
    })
  })
})
