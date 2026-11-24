// Texte für den Kopf der Übersicht (UX-Konzept §8.1, #68): Kernzahl in ganzen Tagen, Engpass, Ziel
// und nächster Schritt. Rein, damit es Tests gibt. Gerechnet ist alles schon im DTO, hier wird nur
// gerundet und formuliert (ruhiger Ton, keine Ausrufezeichen, DESIGN_SYSTEM §9).
import { formatDayWithPrecision, toCalendarDay } from '@/shared/lib/dates'
import { formatGermanNumber } from '@/shared/lib/quantities'
import { formatDays } from '@/shared/lib/supply-terms'
import type { OverviewGoal, OverviewNextStep, OverviewSupply } from '../schemas'

const ML_PER_LITER = 1000
// kcal im nächsten Schritt auf Hunderter, damit keine Genauigkeit versprochen wird, die es nicht gibt
const KCAL_STEP = 100

/** Im Satz stehen ganze Tage, abgerundet (UX-Konzept §14 Frage 1). */
const wholeDays = (days: number) => Math.floor(days)

const dayWord = (count: number) => (count === 1 ? 'Tag' : 'Tage')

export const formatDate = (iso: string) =>
  formatDayWithPrecision({ date: toCalendarDay(iso), precision: 'day' })

// Übererfüllung läuft sichtbar über die Zielmarke, aber höchstens bis zum Doppelten des Ziels,
// damit die Marke nicht an den Rand gedrückt wird. Der Wert rechts nennt die echte Zahl.
const MAX_SCALE_FACTOR = 2
const MIN_SCALE_DAYS = 1

/** Ende der Tages-Skala für eine Liste von Balken. */
export function scaleFor(days: readonly number[], goalDays: number | null): number {
  const longest = Math.max(MIN_SCALE_DAYS, ...days)
  if (goalDays === null) return longest
  return Math.min(Math.max(goalDays, longest), goalDays * MAX_SCALE_FACTOR)
}

/** Kernzahl: „ca.“ ab 10 % Richtwert-Anteil, dann ganze Tage. */
export function headline(supply: Pick<OverviewSupply, 'days' | 'isApproximate'>): {
  prefix: string
  value: string
  unit: string
} {
  const days = wholeDays(supply.days)
  return { prefix: supply.isApproximate ? 'ca.' : '', value: String(days), unit: dayWord(days) }
}

/** Ein Satz, was begrenzt. Bei Gleichstand beides. */
export function limitingSentence({
  energyDays,
  waterDays,
}: Pick<OverviewSupply, 'energyDays' | 'waterDays'>): string {
  if (energyDays === waterDays) return 'Essen und Wasser reichen gleich lang.'
  return energyDays < waterDays
    ? 'Essen begrenzt euren Vorrat, Wasser reicht länger.'
    : 'Wasser begrenzt euren Vorrat, Essen reicht länger.'
}

type Line = Readonly<{ title: string; subtitle: string | null }>

function packagesSentence(count: number): string | null {
  if (count === 0) return null
  return count === 1 ? '1 Packung läuft vorher ab.' : `${String(count)} Packungen laufen vorher ab.`
}

/** Zielzeile: „Am 01.03.2027 wären es 5 von 10 Tagen.“ Ohne Datum nur das Ziel. */
export function goalLine(goal: OverviewGoal): Line {
  const { days, date, outlook } = goal
  if (date === null) {
    return {
      title: `Euer Ziel: ${formatDays(days)}`,
      subtitle: 'Ein Zieldatum legt ihr in den Einstellungen fest.',
    }
  }
  if (outlook === null)
    return { title: `Ziel: ${formatDays(days)} bis ${formatDate(date)}`, subtitle: null }
  if (outlook.kind === 'in-past') {
    return {
      title: `Das Zieldatum ${formatDate(date)} ist vorbei.`,
      subtitle: 'Ein neues Datum legt ihr in den Einstellungen fest.',
    }
  }
  const atTarget = `${String(wholeDays(outlook.days))} von ${String(days)} Tagen`
  if (outlook.isReached) {
    return { title: `Ziel erreicht: am ${formatDate(date)} sind es ${atTarget}.`, subtitle: null }
  }
  return {
    title: `Am ${formatDate(date)} wären es ${atTarget}.`,
    subtitle: packagesSentence(outlook.expiringPackages),
  }
}

type Shortfall = Pick<OverviewNextStep, 'resource' | 'missing'>

function amountText({ resource, missing }: Shortfall): string {
  if (resource === 'water') {
    return `${formatGermanNumber(Math.ceil(missing / ML_PER_LITER))} l Wasser`
  }
  return `etwa ${formatGermanNumber(Math.ceil(missing / KCAL_STEP) * KCAL_STEP)} kcal Essen`
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/**
 * Der eine nächste Schritt: „20 l Wasser bringen euch ans Ziel.“ Fehlt auch beim anderen Wert
 * etwas, stehen beide Mengen im Satz, Engpass zuerst. Eine Menge, die nur bis zum nächsten Engpass
 * trägt („47 l Wasser bringen euch auf 2 Tage“), verwirrte.
 */
export function nextStepSentence(step: OverviewNextStep): string {
  const amount = amountText(step)
  if (step.alsoMissing === null) return `${capitalize(amount)} bringen euch ans Ziel.`
  return `Bis zum Ziel fehlen noch ${amount} und ${amountText(step.alsoMissing)}.`
}
