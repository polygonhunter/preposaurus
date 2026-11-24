import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { PackagingSuggestion } from '../domain/map-recognition'
import { photoCaptureReducer, type PhotoCaptureAction } from './photo-capture-reducer'
import { initialPhotoCapture, type PhotoCaptureState } from './photo-capture-state'

// Vorschlag einer neuen Lebensmittelart aus der Erkennung (#142): nur ein Angebot, Dubletten werden
// zur vorhandenen Art, eine eigene Wahl geht immer vor.
const lookup = {
  foodTypes: [
    { id: 'art-nudeln', key: 'nudeln', name: 'Nudeln', searchTerms: [] },
    { id: 'art-eigen', key: 'eigen_graupen', name: 'Graupen', searchTerms: ['Rollgerste'] },
  ],
  containers: [],
  categories: [{ id: 'kat-reis', name: 'Reis und Getreide' }],
}

const recognizedPackaging = (
  newFoodType: PackagingSuggestion['newFoodType'],
): PhotoCaptureAction => ({
  type: 'recognized',
  localId: 'v',
  outcome: {
    ok: true,
    suggestion: {
      role: 'verpackung',
      packaging: {
        name: null,
        foodTypeKey: null,
        newFoodType,
        container: null,
        content: null,
        drainedWeightG: null,
        confidence: 'medium',
      },
    },
  },
  context: { lookup, today: toCalendarDay('2026-11-24') },
})

const shotThenRead = (start: PhotoCaptureState, newFoodType: PackagingSuggestion['newFoodType']) =>
  [
    {
      type: 'shot',
      photo: {
        localId: 'v',
        role: 'verpackung',
        status: 'uploaded',
        photoId: 'f',
        previewUrl: null,
        message: null,
      },
    } as const,
    recognizedPackaging(newFoodType),
  ].reduce(photoCaptureReducer, start)

const proposal = (name: string, categoryName = 'Reis und Getreide') => ({ name, categoryName })

describe('Vorschlag einer neuen Lebensmittelart', () => {
  it('bietet eine neue Art an, ordnet die Kategorie zu und wählt nichts aus', () => {
    const state = shotThenRead(initialPhotoCapture(null), proposal('Dinkelreis'))

    expect(state.foodTypeId).toBeNull()
    expect(state.foodTypeProposal).toEqual({
      name: 'Dinkelreis',
      categoryId: 'kat-reis',
      categoryName: 'Reis und Getreide',
    })
  })

  it('wählt die vorhandene Art statt einer Dublette, auch über Groß/klein und Suchwörter', () => {
    expect(shotThenRead(initialPhotoCapture(null), proposal('nudeln'))).toMatchObject({
      foodTypeId: 'art-nudeln',
      foodTypeProposal: null,
    })
    expect(shotThenRead(initialPhotoCapture(null), proposal('Penne'))).toMatchObject({
      foodTypeId: 'art-nudeln',
      foodTypeProposal: null,
    })
    expect(shotThenRead(initialPhotoCapture(null), proposal('ROLLGERSTE'))).toMatchObject({
      foodTypeId: 'art-eigen',
      foodTypeProposal: null,
    })
  })

  it('lässt eine eigene Wahl stehen und bietet dann nichts an', () => {
    const chosen = photoCaptureReducer(initialPhotoCapture(null), {
      type: 'edit',
      update: { foodTypeId: 'art-eigen' },
    })
    const state = shotThenRead(chosen, proposal('Dinkelreis'))

    expect(state.foodTypeId).toBe('art-eigen')
    expect(state.foodTypeProposal).toBeNull()
  })

  it('behält den Namen einer unbekannten Kategorie, ohne ID', () => {
    const state = shotThenRead(initialPhotoCapture(null), proposal('Dinkelreis', 'Backwaren'))

    expect(state.foodTypeProposal).toMatchObject({ categoryId: null, categoryName: 'Backwaren' })
  })

  it('verschwindet mit eigener Wahl oder „Andere wählen“', () => {
    const offered = shotThenRead(initialPhotoCapture(null), proposal('Dinkelreis'))

    const chosen = photoCaptureReducer(offered, {
      type: 'edit',
      update: { foodTypeId: 'art-nudeln' },
    })
    const dismissed = photoCaptureReducer(offered, {
      type: 'edit',
      update: { foodTypeProposal: null },
    })

    expect(chosen.foodTypeProposal).toBeNull()
    expect(dismissed).toMatchObject({ foodTypeProposal: null, foodTypeId: null })
  })

  it('bietet ohne Vorschlag nichts an', () => {
    expect(shotThenRead(initialPhotoCapture(null), null).foodTypeProposal).toBeNull()
  })
})
