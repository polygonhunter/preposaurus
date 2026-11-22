import type { NeedsByMemberType } from './daily-need'
import type { Diet, GroupTarget, HouseholdMember } from './group-targets'

/**
 * Grundlage für Bedarf und Zielmengen eines Haushalts, so wie sie aus Mitgliedern, aktiver
 * Quelle (`quelle_bedarf`, `quelle_wert`) und Ziel gelesen wird. Ohne aktive Quelle sind
 * `needs` und `targetsByDiet` leer: Dann gibt es keine Tage und keine Abdeckung, aber Summen.
 */
export interface SupplyBasis {
  members: readonly HouseholdMember[]
  householdDiet: Diet
  needs: NeedsByMemberType
  /** Menge je Person und Tag je Ernährungsform, wie in `quelle_wert` gespeichert */
  targetsByDiet: Partial<Record<Diet, readonly GroupTarget[]>>
  /** Zieldauer in Tagen, null ohne Ziel */
  goalDays: number | null
}
