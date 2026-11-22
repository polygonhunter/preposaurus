import type { CalendarDay } from '@/shared/lib/dates'

/** Gespeicherter Status einer Einheit. Die Ampel wird nie gespeichert, sondern berechnet. */
export type UnitStatus = 'stock' | 'consumed' | 'discarded'

/** Wie genau das MHD aufgedruckt ist: Tag, nur Monat (→ Monatsende) oder nur Jahr (→ 31.12.). */
export type BestBeforePrecision = 'day' | 'month' | 'year'

/** MHD oder Verbrauchsdatum („zu verbrauchen bis“). */
export type DateKind = 'best-before' | 'use-by'

/**
 * Ein MHD mit Genauigkeit. Geschätzt wird nur auf ausdrückliche Wahl durch die KI (#116), dann
 * trägt das Datum immer das Kennzeichen. Ein Richtwert wird nie zum MHD (#110).
 */
export interface BestBefore {
  date: CalendarDay
  precision: BestBeforePrecision
  isEstimated: boolean
}

/** Eine Packung im Haushalt, so wie die Fachlogik sie braucht. */
export interface StockUnit {
  id: string
  status: UnitStatus
  /** null heißt „Datum fehlt“ (#116): zählt heute mit, fürs Zieldatum nicht. Nie geschätzt. */
  bestBefore: BestBefore | null
  kind: DateKind
  /** „Noch gut“ geprüft am, sonst null */
  checkedAt: CalendarDay | null
}
