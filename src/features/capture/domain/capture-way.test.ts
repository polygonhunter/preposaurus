import { describe, expect, it } from 'vitest'
import { isPhotoWayReplaced, pickCaptureWay } from './capture-way'

describe('pickCaptureWay', () => {
  it('nimmt mit bereiter Erkennung den zuletzt genutzten Weg, beim ersten Mal das Foto', () => {
    expect(pickCaptureWay({ last: 'manual', isRecognitionReady: true })).toBe('manual')
    expect(pickCaptureWay({ last: 'photo', isRecognitionReady: true })).toBe('photo')
    expect(pickCaptureWay({ last: null, isRecognitionReady: true })).toBe('photo')
  })

  it('startet ohne Erkennung immer im Formular, auch nach einer Foto-Erfassung (#79)', () => {
    expect(pickCaptureWay({ last: 'photo', isRecognitionReady: false })).toBe('manual')
    expect(pickCaptureWay({ last: null, isRecognitionReady: false })).toBe('manual')
    expect(pickCaptureWay({ last: 'manual', isRecognitionReady: false })).toBe('manual')
  })
})

describe('isPhotoWayReplaced', () => {
  it('erklärt den Wechsel nur, wenn der gewohnte Weg das Foto war', () => {
    expect(isPhotoWayReplaced({ last: 'photo', isRecognitionReady: false })).toBe(true)
    expect(isPhotoWayReplaced({ last: 'manual', isRecognitionReady: false })).toBe(false)
    expect(isPhotoWayReplaced({ last: null, isRecognitionReady: false })).toBe(false)
    expect(isPhotoWayReplaced({ last: 'photo', isRecognitionReady: true })).toBe(false)
  })
})
