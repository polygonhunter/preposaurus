import { formatDayWithPrecision, type CalendarDay } from '@/shared/lib/dates'
import type { DueGroup } from '@/features/inventory/domain/due-bundles'
import { countWithNoun, nameItems, totalUnits, type DueItem, type ReminderMessage } from './message'

// Wochenübersicht (ERI-02): ein ruhiger Wochenblick statt vieler Einzelmeldungen. Beispiel aus
// technik.html: „3 Einheiten bald verbrauchen · Ziel: 6 von 10 Tagen · Nachkaufen: 6 l Wasser“.
// Die Gruppe „In 3 Monaten“ fehlt bewusst, sie ist noch weit weg.

/** Stand des Ziels, wie die Übersicht ihn rechnet (M7). */
interface GoalStatus {
  suppliedDays: number
  targetDays: number
  /** null, wenn der Haushalt kein Zieldatum gesetzt hat */
  targetDate: CalendarDay | null
}

export interface WeeklySummaryInput {
  dueItems: readonly DueItem[]
  /** Packungen mit „Datum fehlt“ (#116): höchstens eine Zeile, nie ein Anlass */
  missingDateCount: number
  goal: GoalStatus | null
  openRestockCount: number
}

const packages = (count: number) => countWithNoun(count, 'Packung', 'Packungen')

function itemsIn(items: readonly DueItem[], group: DueGroup): DueItem[] {
  return items.filter((item) => item.group === group)
}

function dueLines(items: readonly DueItem[]): string[] {
  const lines: string[] = []
  const expired = itemsIn(items, 'expired')
  const thisWeek = itemsIn(items, 'this-week')
  const thisMonth = itemsIn(items, 'this-month')
  if (expired.length > 0) {
    lines.push(`${packages(totalUnits(expired))} abgelaufen: kurz ansehen und entscheiden.`)
  }
  if (thisWeek.length > 0) {
    lines.push(`${packages(totalUnits(thisWeek))} diese Woche verbrauchen: ${nameItems(thisWeek)}.`)
  }
  if (thisMonth.length > 0) {
    lines.push(`${packages(totalUnits(thisMonth))} in den nächsten Wochen einplanen.`)
  }
  return lines
}

const isGoalReached = (goal: GoalStatus) => goal.suppliedDays >= goal.targetDays

function goalLine(goal: GoalStatus): string {
  const days = `${String(Math.floor(goal.suppliedDays))} von ${String(goal.targetDays)} Tagen`
  if (isGoalReached(goal)) return `Ziel erreicht: ${days}.`
  const date =
    goal.targetDate === null
      ? ''
      : ` ${formatDayWithPrecision({ date: goal.targetDate, precision: 'day' })}`
  return `Ziel${date}: ${days}.`
}

function restockLine(openCount: number): string {
  return `Nachkaufen: ${countWithNoun(openCount, 'Eintrag', 'Einträge')} offen.`
}

/**
 * Baut die Wochenübersicht. null, wenn es keinen Anlass gibt: nichts fällig, nichts nachzukaufen
 * und das Ziel erreicht (oder keins gesetzt). „Datum fehlt“ allein ist kein Anlass.
 */
export function buildWeeklySummary(input: WeeklySummaryInput): ReminderMessage | null {
  const lines = dueLines(input.dueItems)
  if (input.openRestockCount > 0) lines.push(restockLine(input.openRestockCount))
  const hasOpenGoal = input.goal !== null && !isGoalReached(input.goal)
  if (lines.length === 0 && !hasOpenGoal) return null
  if (input.goal !== null) lines.push(goalLine(input.goal))
  if (input.missingDateCount > 0) {
    lines.push(`Bei ${packages(input.missingDateCount)} fehlt noch das Datum.`)
  }
  return { kind: 'weekly-summary', title: 'Wochenübersicht', lines, target: 'overview' }
}
