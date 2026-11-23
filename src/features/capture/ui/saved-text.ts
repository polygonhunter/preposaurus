// Satz nach dem Speichern (#231, UX-Konzept §8.5 „Danach“): „Euer Essen reicht jetzt 11,3 statt 9,4
// Tage.“ Ruhig, ohne Ausrufezeichen (DESIGN_SYSTEM §9). Ob es den Satz gibt, entscheidet der Server
// (compareSupplyDays), hier wird nur formuliert. Die Tage stehen wie an den Balken der Übersicht.
import { formatGermanNumber } from '@/shared/lib/quantities'
import type { SupplyChange } from '../domain/supply-change'

const SUBJECT: Record<SupplyChange['resource'], string> = {
  energy: 'Euer Essen',
  water: 'Euer Wasser',
}

const dayWord = (days: number) => (days === 1 ? 'Tag' : 'Tage')

/** „Euer Essen reicht jetzt 11,3 statt 9,4 Tage.“, ab 0 „… reicht jetzt für 2,1 Tage.“ */
export function supplyChangeText({ resource, before, after }: SupplyChange): string {
  const subject = SUBJECT[resource]
  const now = formatGermanNumber(after)
  if (before === 0) return `${subject} reicht jetzt für ${now} ${dayWord(after)}.`
  if (after === 1) return `${subject} reicht jetzt 1 Tag statt ${formatGermanNumber(before)} Tage.`
  return `${subject} reicht jetzt ${now} statt ${formatGermanNumber(before)} Tage.`
}
