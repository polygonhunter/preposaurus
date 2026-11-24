import { describe, expect, it } from 'vitest'
import { initialPhotoCapture, type CapturedPhoto } from './photo-capture-state'
import { photoLeaveKind } from './photo-leave'

const FOOD_TYPE = '0b1f5c1e-4a3b-4c2d-9e8f-1a2b3c4d5e6f'
const fresh = initialPhotoCapture(null)
const photo: CapturedPhoto = {
  localId: 'a',
  role: 'verpackung',
  status: 'uploading',
  photoId: null,
  previewUrl: null,
  message: null,
}

describe('photoLeaveKind', () => {
  it('frisch geöffnet ist nichts zu verlieren, auch nach dem Blättern in der Kamera', () => {
    expect(photoLeaveKind(fresh, fresh, [])).toBe('none')
    expect(photoLeaveKind(fresh, { ...fresh, step: 'mhd', isCameraOpen: false }, [])).toBe('none')
  })

  it('ein Foto im Upload oder eine Eingabe ohne Entwurf ginge verloren', () => {
    expect(photoLeaveKind(fresh, { ...fresh, photos: [photo] }, [])).toBe('unsaved')
    expect(photoLeaveKind(fresh, { ...fresh, foodTypeId: FOOD_TYPE }, [])).toBe('unsaved')
  })

  it('mit Entwurf liegt alles auf dem NAS', () => {
    const resumed = { ...fresh, draftId: 'e1' }

    expect(photoLeaveKind(resumed, resumed, [])).toBe('draft')
  })
})
