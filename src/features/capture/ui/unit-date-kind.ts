// Datumsart beim „Datum ändern“ (#300): Der Umschalter startet mit der Art der Zeile. Tippt jemand
// „zu verbrauchen bis“ dazu, springt er auf Verbrauchsdatum, wie beim Erfassen (#294). Zurück zum
// MHD geht es nur bewusst über den Umschalter: Ein mitgetipptes „MHD“ stuft nichts herab. Wechselt
// die Art, sagt ein Satz, was das für die Packungen heißt.
import type { DateKind } from '@/features/inventory/domain/unit'
import { detectDateKind } from '../domain/best-before'

interface Typing {
  previousText: string
  nextText: string
  kind: DateKind
}

/**
 * Art nach einer Eingabe. Nur der Moment, in dem „zu verbrauchen bis“ erkannt wird, schaltet um:
 * Wer danach selbst MHD wählt und weitertippt, behält seine Wahl.
 */
export function kindAfterTyping({ previousText, nextText, kind }: Typing): DateKind {
  const isNewlyUseBy =
    detectDateKind(nextText) === 'use-by' && detectDateKind(previousText) !== 'use-by'
  return isNewlyUseBy ? 'use-by' : kind
}

const KIND_CHANGE_NOTES: Record<DateKind, string> = {
  'use-by': 'Diese Packungen gelten danach als Verbrauchsdatum: nach diesem Tag nicht mehr essen.',
  'best-before': 'Diese Packungen gelten danach als MHD, nicht mehr als Verbrauchsdatum.',
}

/** Satz zum Wechsel der Art, leer, solange die Art der Zeile bleibt. */
export function kindChangeNote(rowKind: DateKind, chosen: DateKind): string {
  return rowKind === chosen ? '' : KIND_CHANGE_NOTES[chosen]
}
