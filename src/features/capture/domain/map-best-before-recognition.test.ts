import { describe, expect, it } from 'vitest'
import type { AiBestBeforeAnswer } from './ai-answers'
import { mapBestBeforeAnswer } from './map-best-before-recognition'

const answer = (overrides: Partial<AiBestBeforeAnswer>): AiBestBeforeAnswer => ({
  roh_text: 'MHD 30.09.2027',
  datum: '2027-09-30',
  genauigkeit: 'tag',
  art: 'mhd',
  sicherheit: 'hoch',
  ...overrides,
})

describe('mapBestBeforeAnswer', () => {
  it('übernimmt ein sicher gelesenes Tagesdatum', () => {
    expect(mapBestBeforeAnswer(answer({}))).toEqual({
      bestBefore: { date: '2027-09-30', precision: 'day', isEstimated: false },
      kind: 'best-before',
      rawText: 'MHD 30.09.2027',
      confidence: 'high',
    })
  })

  it('setzt bei „nur Monat“ das Monatsende und bei „nur Jahr“ den 31.12.', () => {
    const month = mapBestBeforeAnswer(answer({ datum: '2027-02-01', genauigkeit: 'monat' }))
    const year = mapBestBeforeAnswer(answer({ datum: '2027-01-01', genauigkeit: 'jahr' }))

    expect(month.bestBefore).toEqual({ date: '2027-02-28', precision: 'month', isEstimated: false })
    expect(year.bestBefore).toEqual({ date: '2027-12-31', precision: 'year', isEstimated: false })
  })

  it('erkennt das Verbrauchsdatum und lässt eine unklare Art offen', () => {
    expect(mapBestBeforeAnswer(answer({ art: 'verbrauchen_bis' })).kind).toBe('use-by')
    expect(mapBestBeforeAnswer(answer({ art: 'unbekannt' })).kind).toBeNull()
  })

  it('macht ein Datum mit unbekannter Genauigkeit zu „bitte prüfen“, ohne etwas zu ergänzen', () => {
    const reading = mapBestBeforeAnswer(answer({ genauigkeit: 'unbekannt' }))

    expect(reading.bestBefore).toEqual({ date: '2027-09-30', precision: 'day', isEstimated: false })
    expect(reading.confidence).toBe('low')
  })

  it('übergibt mittlere und niedrige Sicherheit unverändert', () => {
    expect(mapBestBeforeAnswer(answer({ sicherheit: 'mittel' })).confidence).toBe('medium')
    expect(mapBestBeforeAnswer(answer({ sicherheit: 'niedrig' })).confidence).toBe('low')
  })

  it('räumt den Aufdruck auf, leerer Aufdruck wird null', () => {
    expect(mapBestBeforeAnswer(answer({ roh_text: '  09/2027 ' })).rawText).toBe('09/2027')
    expect(mapBestBeforeAnswer(answer({ roh_text: '   ' })).rawText).toBeNull()
    expect(mapBestBeforeAnswer(answer({ roh_text: null })).rawText).toBeNull()
  })

  describe('erfindet nie ein Datum', () => {
    it('lässt das MHD leer, wenn die KI kein Datum liefert', () => {
      const reading = mapBestBeforeAnswer(answer({ datum: null, sicherheit: 'niedrig' }))

      expect(reading.bestBefore).toBeNull()
    })

    it.each(['30.09.2027', 'MHD 09/2027', '2027-09-30', 'Ende 2027'])(
      'liest kein Datum aus roh_text „%s“, wenn datum null ist',
      (rawText) => {
        const reading = mapBestBeforeAnswer(answer({ roh_text: rawText, datum: null }))

        expect(reading.bestBefore).toBeNull()
        expect(reading.rawText).toBe(rawText)
      },
    )

    it.each(['30.09.2027', '2027-02-30', '2027-13-01', 'morgen', '', '27-09-30', '2027-9-1'])(
      'lässt das MHD leer bei ungültigem datum „%s“',
      (datum) => {
        expect(mapBestBeforeAnswer(answer({ datum })).bestBefore).toBeNull()
      },
    )

    it('kennzeichnet ein gelesenes Datum nie als Schätzung und nie umgekehrt', () => {
      expect(mapBestBeforeAnswer(answer({})).bestBefore?.isEstimated).toBe(false)
    })
  })
})
