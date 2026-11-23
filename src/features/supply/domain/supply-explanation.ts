// Grundlage des Erklär-Blatts (#219, UX-Konzept §8.1 Punkt 5): Bedarf je Personengruppe und die
// Packungen, die heute nicht oder nur unter Vorbehalt zählen. Die Regeln selbst stehen in
// supply-rules (isCountedOn), hier wird nur nach Grund gezählt.
import type { CalendarDay } from '@/shared/lib/dates'
import { needFor, type MemberType, type NeedsByMemberType, type PersonNeed } from './daily-need'
import { isFreshOn, type CountableUnit } from './supply-rules'

/** Bedarf einer Personengruppe: so viele Personen mit je diesem Bedarf am Tag. */
export interface NeedLine extends PersonNeed {
  type: MemberType
  count: number
}

/** Packungen im Vorrat nach dem Grund, aus dem sie heute nicht sicher mitzählen. */
export interface PackageCaveats {
  /** Abgelaufen und nicht geprüft: zählt nicht */
  expired: number
  /** Abgelaufen, aber „Noch gut“ geprüft: zählt heute nur mit dem Schalter (#117) */
  stillGood: number
  /** „Datum fehlt“: zählt heute, am Zieldatum nicht (#116) */
  missingDate: number
}

// Reihenfolge im Blatt: von den Erwachsenen zu den Kleinen, wie im Formular der Mitglieder
const TYPE_ORDER: readonly MemberType[] = ['adult', 'senior', 'teen', 'child', 'baby']

/** Bedarf je Personengruppe, nur Gruppen, die im Bedarf mitzählen und einen Wert haben. */
export function breakDownNeed(
  members: readonly { type: MemberType }[],
  needs: NeedsByMemberType,
): NeedLine[] {
  return TYPE_ORDER.flatMap((type) => {
    const count = members.filter((member) => member.type === type).length
    const need = needFor(type, needs)
    if (count === 0 || need === null) return []
    return [{ type, count, kcalPerDay: need.kcalPerDay, waterMlPerDay: need.waterMlPerDay }]
  })
}

type Caveat = keyof PackageCaveats

function caveatOf(unit: CountableUnit, today: CalendarDay): Caveat | null {
  if (unit.status !== 'stock') return null
  if (unit.bestBefore === null) return 'missingDate'
  if (isFreshOn(unit, today)) return null
  return unit.checkedAt === null ? 'expired' : 'stillGood'
}

/** Zählt die Packungen im Vorrat, die heute nicht oder nur unter Vorbehalt mitzählen. */
export function countPackageCaveats(
  units: readonly CountableUnit[],
  today: CalendarDay,
): PackageCaveats {
  const caveats: PackageCaveats = { expired: 0, stillGood: 0, missingDate: 0 }
  for (const unit of units) {
    const caveat = caveatOf(unit, today)
    if (caveat !== null) caveats[caveat] += 1
  }
  return caveats
}
