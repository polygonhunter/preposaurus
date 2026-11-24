import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import type { RecognitionOutcome } from './photo-api'
import { photoCaptureReducer, type PhotoCaptureAction } from './photo-capture-reducer'
import {
  initialPhotoCapture,
  type CapturedPhoto,
  type PhotoCaptureState,
} from './photo-capture-state'
import { saveBlocker } from './photo-shots'

const today = toCalendarDay('2026-11-23')
const lookup = {
  foodTypes: [
    { id: 'art-spaghetti', key: 'spaghetti', name: 'Spaghetti', searchTerms: [] },
    { id: 'art-nudeln', key: 'nudeln', name: 'Nudeln', searchTerms: [] },
  ],
  containers: [{ id: 'beh-packung', key: 'packung', name: 'Packung' }],
  categories: [{ id: 'kat-reis', name: 'Reis und Getreide' }],
}

function photo(localId: string, role: CapturedPhoto['role']): CapturedPhoto {
  return { localId, role, status: 'uploading', photoId: null, previewUrl: null, message: null }
}

const run = (state: PhotoCaptureState, ...actions: PhotoCaptureAction[]) =>
  actions.reduce(photoCaptureReducer, state)

const recognized = (localId: string, outcome: RecognitionOutcome): PhotoCaptureAction => ({
  type: 'recognized',
  localId,
  outcome,
  context: { lookup, today },
})

const mhdRead = (
  datum: string | null,
  confidence: 'high' | 'low' = 'high',
): RecognitionOutcome => ({
  ok: true,
  suggestion: {
    role: 'mhd',
    conflictingDate: null,
    bestBefore: {
      bestBefore:
        datum === null
          ? null
          : { date: toCalendarDay(datum), precision: 'day', isEstimated: false },
      kind: 'best-before',
      rawText: datum,
      confidence,
    },
  },
})

describe('photoCaptureReducer', () => {
  it('geht nach Verpackung und Nährwerten von selbst zum nächsten Schritt', () => {
    const state = run(
      initialPhotoCapture(null),
      { type: 'shot', photo: photo('v', 'verpackung') },
      { type: 'shot', photo: photo('n', 'naehrwerte') },
    )

    expect(state.step).toBe('mhd')
    expect(state.isCameraOpen).toBe(true)
    expect(state.readings.verpackung.state).toBe('reading')
  })

  it('füllt aus der Verpackung nur leere Felder, Nicht Erkanntes bleibt leer', () => {
    const start = run(initialPhotoCapture(null), { type: 'edit', update: { content: '400 g' } })
    const state = run(
      start,
      { type: 'shot', photo: photo('v', 'verpackung') },
      recognized('v', {
        ok: true,
        suggestion: {
          role: 'verpackung',
          packaging: {
            name: 'Spaghetti',
            foodTypeKey: 'spaghetti',
            newFoodType: null,
            container: null,
            content: { value: 500, unit: 'g' },
            drainedWeightG: null,
            confidence: 'high',
          },
        },
      }),
    )

    expect(state).toMatchObject({
      foodTypeId: 'art-spaghetti',
      name: 'Spaghetti',
      content: '400 g',
      containerId: null,
      readings: { verpackung: { state: 'done' } },
    })
  })

  it('übernimmt ein sicheres MHD als Eintrag und zählt dasselbe Datum hoch', () => {
    const state = run(
      initialPhotoCapture(null),
      { type: 'open-camera', step: 'mhd' },
      { type: 'shot', photo: photo('a', 'mhd') },
      { type: 'shot', photo: photo('b', 'mhd') },
      recognized('a', mhdRead('2027-09-30')),
      recognized('b', mhdRead('2027-09-30')),
    )

    expect(state.shots).toEqual([])
    expect(state.units).toMatchObject([{ count: 2, kind: 'best-before' }])
  })

  it('lässt ein unlesbares oder zweifelhaftes MHD offen und sperrt das Speichern', () => {
    const state = run(
      initialPhotoCapture(null),
      { type: 'shot', photo: { ...photo('a', 'mhd'), status: 'uploaded' } },
      { type: 'shot', photo: { ...photo('b', 'mhd'), status: 'uploaded' } },
      recognized('a', mhdRead(null)),
      recognized('b', mhdRead('2027-09-30', 'low')),
    )

    expect(state.units).toEqual([])
    expect(state.shots.map((shot) => shot.issue)).toEqual(['unreadable', 'review'])
    expect(saveBlocker(state)).toBe('Ein MHD-Foto braucht noch eine Entscheidung.')
  })

  it('löst offene Fotos nur durch eine Entscheidung', () => {
    const open = run(
      initialPhotoCapture(null),
      { type: 'shot', photo: { ...photo('a', 'mhd'), status: 'uploaded' } },
      { type: 'shot', photo: { ...photo('b', 'mhd'), status: 'uploaded' } },
      recognized('a', mhdRead(null)),
      recognized('b', mhdRead('2027-09-30', 'low')),
    )

    const state = run(
      open,
      { type: 'resolve-shot', localId: 'a', resolution: 'missing' },
      { type: 'resolve-shot', localId: 'b', resolution: 'confirm' },
    )

    expect(state.shots).toEqual([])
    expect(state.units.map((entry) => entry.bestBefore?.date ?? null)).toEqual(['2027-09-30', null])
    expect(saveBlocker(state)).toBeNull()
  })

  it('markiert ein MHD als nicht gelesen, wenn die Erkennung aus ist', () => {
    const state = run(
      initialPhotoCapture(null),
      { type: 'shot', photo: photo('v', 'verpackung') },
      { type: 'shot', photo: photo('a', 'mhd') },
      recognized('v', { ok: false, kind: 'unavailable', message: 'aus' }),
      recognized('a', { ok: false, kind: 'unavailable', message: 'aus' }),
    )

    expect(state.readings.verpackung).toEqual({ state: 'unavailable', message: 'aus' })
    expect(state.shots[0]?.issue).toBe('not-read')
  })

  it('merkt sich den Entwurf aus dem ersten Upload', () => {
    const state = run(
      initialPhotoCapture(null),
      { type: 'shot', photo: photo('v', 'verpackung') },
      {
        type: 'upload',
        localId: 'v',
        update: { status: 'uploaded', photoId: 'f1', draftId: 'e1' },
      },
    )

    expect(state.draftId).toBe('e1')
    expect(state.photos[0]).toMatchObject({ status: 'uploaded', photoId: 'f1' })
  })
})
