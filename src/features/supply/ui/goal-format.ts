// Texte und Startwerte rund ums Ziel (#39), gleich für Formular, Lesesicht und Einstellungs-Übersicht.
import { GOAL_DAY_PRESETS } from '@/shared/config/constants'
import { dayParts, type CalendarDay } from '@/shared/lib/dates'
import { CUSTOM_GOAL_CHOICE } from '../schemas'

export type GoalFormValues = Readonly<{ choice: string; customDays: string; targetDate: string }>

const isPreset = (days: number) => (GOAL_DAY_PRESETS as readonly number[]).includes(days)

export const formatGoalDays = (days: number) => (days === 1 ? '1 Tag' : `${String(days)} Tage`)

/** „31.12.2026“ */
export function formatTargetDate(day: CalendarDay): string {
  const { year, month, day: dayOfMonth } = dayParts(day)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(dayOfMonth)}.${pad(month)}.${String(year)}`
}

/** Zeile in den Einstellungen: „10 Tage bis 01.03.2027“, ohne Datum nur die Dauer (UX §8.6) */
export function formatGoalSummary(
  goal: Readonly<{ days: number; targetDate: CalendarDay | null }>,
): string {
  const days = formatGoalDays(goal.days)
  return goal.targetDate === null ? days : `${days} bis ${formatTargetDate(goal.targetDate)}`
}

export function goalFormValuesOf(goal: Readonly<{ days: number; targetDate: CalendarDay | null }>) {
  const preset = isPreset(goal.days)
  return {
    choice: preset ? String(goal.days) : CUSTOM_GOAL_CHOICE,
    customDays: preset ? '' : String(goal.days),
    targetDate: goal.targetDate ?? '',
  } satisfies GoalFormValues
}

/** 3 Tage · 10 Tage · 14 Tage · Eigener Wert */
export const GOAL_CHOICE_OPTIONS = [
  ...GOAL_DAY_PRESETS.map((days) => ({ value: String(days), label: formatGoalDays(days) })),
  { value: CUSTOM_GOAL_CHOICE, label: 'Eigener Wert' },
]
