// Port der schreibenden Vorrat-Aktionen (#46). Umgesetzt von `createUnitWriteRepository` in
// inventory/data, in Tests von einem Fake. Jede Methode nimmt die haushalt_id: Eine fremde oder
// unbekannte Packung ist „nicht gefunden“, nie „verboten“ (#133).
import 'server-only'

/** Entnahme einer Packung: wer, wann und mit welchem Status sie den Vorrat verlässt. */
interface TakeOut {
  unitId: string
  status: 'consumed' | 'discarded'
  userId: string
  at: Date
}

export interface UnitWriter {
  /** Bedingtes Update: greift nur, solange die Packung im Vorrat ist (doppelte Entnahme). */
  takeOut: (
    householdId: string,
    change: TakeOut,
  ) => Promise<'updated' | 'not-in-stock' | 'not-found'>
  /**
   * Rückgängig: holt eine Packung zurück in den Vorrat, aber nur, wenn genau dieser Nutzer sie
   * verbraucht hat. Eine fremde Entnahme oder eine entsorgte Packung gilt als „nicht gefunden“.
   */
  returnToStock: (
    householdId: string,
    taken: Readonly<{ unitId: string; userId: string }>,
  ) => Promise<'updated' | 'already-in-stock' | 'not-found'>
}
