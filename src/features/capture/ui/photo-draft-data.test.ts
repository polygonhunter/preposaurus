import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { captureDraftDataSchema } from '../schemas/draft'
import { initialPhotoCapture, type PhotoCaptureState } from './photo-capture-state'
import { fromDraft, toDraftData } from './photo-draft-data'

const containers = [{ id: '00000000-0000-4000-8000-0000000000aa', key: 'dose', name: 'Dose' }]
const foodTypeId = '00000000-0000-4000-8000-000000000001'

const filled: PhotoCaptureState = {
  ...initialPhotoCapture(null),
  draftId: 'e1',
  isCameraOpen: false,
  foodTypeId,
  name: 'Linsen in Brühe',
  content: '400 g',
  containerId: containers[0]?.id ?? null,
  drainedWeight: '240',
  nutrition: { kcal: '95', protein: '6,5', carbs: '', fat: '' },
  nutritionSource: 'ai-estimate',
  isEstimateConfirmed: true,
  hasNoTable: true,
  units: [
    {
      bestBefore: { date: toCalendarDay('2027-09-30'), precision: 'month', isEstimated: false },
      count: 4,
      kind: 'use-by',
    },
    { bestBefore: null, count: 2 },
  ],
}

describe('Entwurf der Foto-Erfassung', () => {
  it('passt zum Entwurfs-Schema und kommt nach dem Fortsetzen gleich zurück', () => {
    const data = toDraftData(filled, containers)

    expect(captureDraftDataSchema.safeParse(data).success).toBe(true)
    const restored = fromDraft({
      draftId: 'e1',
      data,
      photos: [{ id: 'f1', role: 'verpackung' }],
      containers,
    })
    expect(restored).toMatchObject({
      foodTypeId,
      name: 'Linsen in Brühe',
      content: '400 g',
      containerId: filled.containerId,
      drainedWeight: '240',
      nutrition: { kcal: '95', protein: '6,5', carbs: '', fat: '' },
      nutritionSource: 'ai-estimate',
      isEstimateConfirmed: true,
      hasNoTable: true,
      isCameraOpen: false,
      readings: { verpackung: { state: 'done' }, naehrwerte: { state: 'idle' } },
      photos: [{ photoId: 'f1', status: 'uploaded' }],
    })
    expect(restored.units).toEqual([
      { ...filled.units[0], kind: 'use-by' },
      { bestBefore: null, count: 2, kind: 'best-before' },
    ])
  })

  it('beginnt mit leeren Feldern, wenn der Entwurf nichts enthält', () => {
    const restored = fromDraft({ draftId: 'e1', data: {}, photos: [], containers })

    expect(restored).toMatchObject({ foodTypeId: null, content: '', units: [], draftId: 'e1' })
  })
})
