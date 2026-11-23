import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { photoCaptureReducer, type PhotoCaptureAction } from './photo-capture-reducer'
import { initialPhotoCapture, type PhotoCaptureState } from './photo-capture-state'
import { saveBlocker } from './photo-shots'

// Schätzungen auf Wahl (#124, #115): gekennzeichnet, gesondert bestätigt und nie über eine
// inzwischen getroffene Entscheidung oder eigene Eingabe hinweg.

const run = (state: PhotoCaptureState, ...actions: PhotoCaptureAction[]) =>
  actions.reduce(photoCaptureReducer, state)

const shotMhd: PhotoCaptureAction = {
  type: 'shot',
  photo: {
    localId: 'a',
    role: 'mhd',
    status: 'uploading',
    photoId: null,
    previewUrl: null,
    message: null,
  },
}

const unreadable: PhotoCaptureAction = {
  type: 'recognized',
  localId: 'a',
  outcome: {
    ok: true,
    suggestion: {
      role: 'mhd',
      conflictingDate: null,
      bestBefore: { bestBefore: null, kind: 'best-before', rawText: null, confidence: 'high' },
    },
  },
  context: { lookup: { foodTypes: [], containers: [] }, today: toCalendarDay('2026-11-23') },
}

describe('Schätzungen in der Foto-Erfassung', () => {
  it('verlangt die Bestätigung einer Nährwert-Schätzung, Verwerfen leert sie', () => {
    const estimated = run(initialPhotoCapture(null), {
      type: 'estimated-nutrition',
      values: { kcal: 350, protein: null, carbs: null, fat: null },
    })
    expect(estimated.nutrition.kcal).toBe('350')
    expect(saveBlocker(estimated)).toMatch(/geschätzten Nährwerte/)

    expect(saveBlocker(run(estimated, { type: 'estimate-confirmed' }))).toBeNull()
    expect(run(estimated, { type: 'estimate-discarded' })).toMatchObject({
      nutritionSource: null,
      nutrition: { kcal: '' },
    })
  })

  it('übernimmt eine MHD-Schätzung nur auf Wahl und gekennzeichnet', () => {
    const bestBefore = {
      date: toCalendarDay('2028-12-31'),
      precision: 'year',
      isEstimated: true,
    } as const
    const state = run(initialPhotoCapture(null), shotMhd, unreadable, {
      type: 'estimated-date',
      localId: 'a',
      bestBefore,
    })

    expect(state.shots).toEqual([])
    expect(state.units[0]?.bestBefore).toEqual(bestBefore)
  })

  it('verwirft eine späte MHD-Schätzung, wenn das Foto schon entschieden ist', () => {
    const bestBefore = {
      date: toCalendarDay('2028-12-31'),
      precision: 'year',
      isEstimated: true,
    } as const
    const state = run(
      initialPhotoCapture(null),
      shotMhd,
      unreadable,
      { type: 'resolve-shot', localId: 'a', resolution: 'missing' },
      { type: 'estimated-date', localId: 'a', bestBefore },
      { type: 'estimated-date', localId: 'a', bestBefore },
    )

    expect(state.units).toEqual([{ bestBefore: null, count: 1, kind: 'best-before' }])
  })

  it('lässt eingetippte Nährwerte stehen, wenn eine Schätzung später ankommt', () => {
    const state = run(
      initialPhotoCapture(null),
      {
        type: 'edit',
        update: {
          nutrition: { kcal: '120', protein: '', carbs: '', fat: '' },
          nutritionSource: 'manual',
        },
      },
      { type: 'estimated-nutrition', values: { kcal: 350, protein: null, carbs: null, fat: null } },
    )

    expect(state).toMatchObject({ nutritionSource: 'manual', nutrition: { kcal: '120' } })
  })
})
