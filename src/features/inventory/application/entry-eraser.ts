// Port für das endgültige Löschen einer Fehlerfassung (#50, VOR-07). Umgesetzt von
// `createEntryEraseRepository` in inventory/data, in Tests von einem Fake. Alles, was in der DB
// verschwindet, verschwindet in einer Transaktion. Die Dateien löscht danach der Use-Case.
import 'server-only'
import type { DeleteEntryRequest } from '../schemas/requests'

/** Foto, dessen DB-Zeile gelöscht ist und dessen Dateien noch weg müssen. */
export interface ErasedPhoto {
  id: string
  householdId: string
}

interface ErasedRows {
  photos: ErasedPhoto[]
  /** true, wenn das ganze Produkt weg ist (auch, weil seine letzte Packung gelöscht wurde) */
  isProductRemoved: boolean
}

export interface EntryEraser {
  /**
   * Löscht Produkt bzw. Packung samt Verlauf und Fotozeilen, ein leer gewordenes Produkt und leer
   * gewordene Erfassungen. null: im Haushalt nicht gefunden, dann ist nichts gelöscht.
   */
  eraseRows: (householdId: string, target: DeleteEntryRequest) => Promise<ErasedRows | null>
}
