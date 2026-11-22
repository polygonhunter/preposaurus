import type { CalendarDay } from '@/shared/lib/dates'

/** Gespeicherter Status einer Einheit. Die Ampel wird nie gespeichert, sondern berechnet. */
export type UnitStatus = 'stock' | 'consumed' | 'discarded'

/** Wie genau das MHD aufgedruckt ist: Tag, nur Monat (→ Monatsende) oder nur Jahr (→ 31.12.). */
export type BestBeforePrecision = 'day' | 'month' | 'year'

/** MHD oder Verbrauchsdatum („zu verbrauchen bis“). */
export type DateKind = 'best-before' | 'use-by'

/** Ein MHD mit Genauigkeit. Ein geschätztes Datum trägt immer das Kennzeichen. */
export interface BestBefore {
  date: CalendarDay
  precision: BestBeforePrecision
  isEstimated: boolean
}
