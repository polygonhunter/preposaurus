// Port der schreibenden Vorrat-Aktionen (#46, #47). Umgesetzt von `createUnitWriteRepository` in
// inventory/data, in Tests von einem Fake. Jede Methode nimmt die haushalt_id: Eine fremde oder
// unbekannte Packung ist „nicht gefunden“, nie „verboten“ (#133).
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'

/** Wie eine Packung den Vorrat verlässt. */
export type TakeOutcome = 'consumed' | 'discarded'

/** Entnahme einer Packung: wer, wann und mit welchem Status sie den Vorrat verlässt. */
interface TakeOut {
  unitId: string
  status: TakeOutcome
  userId: string
  at: Date
}

/** „Noch gut“ für mehrere Packungen eines Eintrags, geprüft am Stichtag. */
interface StillGoodChange {
  unitIds: readonly string[]
  checkedAt: CalendarDay
}

export interface UnitWriter {
  /** Bedingtes Update: greift nur, solange die Packung im Vorrat ist (doppelte Entnahme). */
  takeOut: (
    householdId: string,
    change: TakeOut,
  ) => Promise<'updated' | 'not-in-stock' | 'not-found'>
  /**
   * Rückgängig: holt eine verbrauchte oder entsorgte Packung zurück in den Vorrat, aber nur, wenn
   * genau dieser Nutzer sie entnommen hat. Eine fremde Entnahme gilt als „nicht gefunden“.
   */
  returnToStock: (
    householdId: string,
    taken: Readonly<{ unitId: string; userId: string }>,
  ) => Promise<'updated' | 'already-in-stock' | 'not-found'>
  /**
   * Setzt `geprueft_am` nur bei Packungen im Vorrat mit abgelaufenem MHD (nicht beim
   * Verbrauchsdatum), die noch nicht geprüft sind. Liefert die geänderten Packungen.
   */
  markStillGood: (householdId: string, change: StillGoodChange) => Promise<string[]>
  /** Rückgängig: löscht `geprueft_am` nur, wo noch genau dieser Tag steht. */
  undoStillGood: (householdId: string, change: StillGoodChange) => Promise<void>
  /** Welche der Packungen es im Haushalt gibt, egal in welchem Status. */
  countOwnUnits: (householdId: string, unitIds: readonly string[]) => Promise<number>
}
