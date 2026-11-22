// MHD aus der KI-Antwort ins Fach-Modell. Regel: Ein Datum wird nie erfunden. Es entsteht nur aus
// dem Feld `datum`. `roh_text` ist reine Anzeige und wird nie zu einem Datum geparst, auch wenn
// darin eines stünde: Hat die KI kein Datum geliefert, war sie sich nicht sicher.
import type { BestBefore, BestBeforePrecision, DateKind } from '@/features/inventory/domain/unit'
import { endOfMonth, endOfYear, parseCalendarDay, type CalendarDay } from '@/shared/lib/dates'
import type { AiBestBeforeAnswer } from './ai-answers'
import { mapConfidence } from './map-recognition'
import type { Confidence } from './plausibility'

export interface BestBeforeReading {
  /** null heißt: nicht lesbar, der Chip bleibt leer und gelb */
  bestBefore: BestBefore | null
  /** null heißt: unklar, ob MHD oder Verbrauchsdatum */
  kind: DateKind | null
  /** Aufdruck wie gelesen, nur zur Anzeige */
  rawText: string | null
  confidence: Confidence
}

const PRECISION: Readonly<Record<AiBestBeforeAnswer['genauigkeit'], BestBeforePrecision | null>> = {
  tag: 'day',
  monat: 'month',
  jahr: 'year',
  unbekannt: null,
}

const KIND: Readonly<Record<AiBestBeforeAnswer['art'], DateKind | null>> = {
  mhd: 'best-before',
  verbrauchen_bis: 'use-by',
  unbekannt: null,
}

/** Nur Monat oder Jahr aufgedruckt: Es gilt das Monats- bzw. Jahresende. */
function normalize(date: CalendarDay, precision: BestBeforePrecision): CalendarDay {
  if (precision === 'month') return endOfMonth(date)
  if (precision === 'year') return endOfYear(date)
  return date
}

/**
 * Ein Datum mit unbekannter Genauigkeit bleibt ein Tagesdatum, wird aber zu „bitte prüfen“
 * (Sicherheit niedrig). Ergänzt wird nichts.
 */
export function mapBestBeforeAnswer(answer: AiBestBeforeAnswer): BestBeforeReading {
  const date = answer.datum === null ? null : parseCalendarDay(answer.datum.trim())
  const precision = PRECISION[answer.genauigkeit]
  const confidence = mapConfidence(answer.sicherheit)
  const rawText = answer.roh_text?.trim() ?? null
  const base = { kind: KIND[answer.art], rawText: rawText === '' ? null : rawText }
  if (date === null) return { ...base, bestBefore: null, confidence }
  const bestBefore: BestBefore = {
    date: normalize(date, precision ?? 'day'),
    precision: precision ?? 'day',
    isEstimated: false,
  }
  return { ...base, bestBefore, confidence: precision === null ? 'low' : confidence }
}
