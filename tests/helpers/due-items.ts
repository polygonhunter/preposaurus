// Einträge von Bald fällig für die Tests der Erinnerungen (reminders/domain).
import type { DueItem } from '../../src/features/reminders/domain/message'
import { toCalendarDay } from '../../src/shared/lib/dates'

interface DueItemOptions {
  group?: DueItem['group']
  unitCount?: number
  precision?: DueItem['bestBefore']['precision']
  isEstimated?: boolean
  latestAddedOn?: string
}

export function dueItem(label: string, date: string, options: DueItemOptions = {}): DueItem {
  return {
    label,
    group: options.group ?? 'this-week',
    bestBefore: {
      date: toCalendarDay(date),
      precision: options.precision ?? 'day',
      isEstimated: options.isEstimated ?? false,
    },
    unitCount: options.unitCount ?? 1,
    latestAddedOn: toCalendarDay(options.latestAddedOn ?? '2026-10-01'),
  }
}
