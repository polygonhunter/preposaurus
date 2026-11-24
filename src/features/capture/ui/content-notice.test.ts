import { describe, expect, it } from 'vitest'
import { contentNoticeOf } from './content-notice'

describe('contentNoticeOf', () => {
  it('weist bei „1.500 l“ auf eine ungewöhnlich große Packung hin', () => {
    expect(contentNoticeOf('1.500 l')).toBe(
      'Ungewöhnlich viel für eine Packung. Bitte prüft den Inhalt.',
    )
  })

  it('weist bei „0,5 g“ auf eine ungewöhnlich kleine Packung hin', () => {
    expect(contentNoticeOf('0,5 g')).toBe(
      'Ungewöhnlich wenig für eine Packung. Bitte prüft den Inhalt.',
    )
  })

  it.each(['500 g', '1,5 l', '25 kg'])('schweigt bei plausiblem Inhalt %s', (text) => {
    expect(contentNoticeOf(text)).toBeNull()
  })

  it.each(['', 'viel', '3 Stück'])('schweigt bei nicht lesbarer Eingabe %j', (text) => {
    expect(contentNoticeOf(text)).toBeNull()
  })
})
