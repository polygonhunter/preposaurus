// Use-Case Übersicht (#67, UX-Konzept §8.1): lädt Bestand, Mitglieder, Quelle und Ziel einmal und
// liefert ein schmales DTO für alle Blöcke der Startseite. Gerechnet wird nur in der Fachlogik
// (supply/domain, über stock-figures und die Lesepfade des Vorrats), die UI formatiert nur noch.
import 'server-only'
import { getDueUnits } from '@/features/inventory/application/get-due-units'
import { loadReadContext, type ReadContext } from '@/features/inventory/application/read-context'
import type { StockReader } from '@/features/inventory/application/stock-reader'
import {
  joinUnits,
  toGroupUnit,
  toNodeUnit,
  type JoinedUnit,
} from '@/features/inventory/application/stock-model'
import type { CalendarDay } from '@/shared/lib/dates'
import type { Overview } from '../schemas'
import type { ReferenceDay } from '../domain/supply-rules'
import type { HouseholdFactsReader, HouseholdGoal } from './household-facts-reader'
import { headFigures } from './overview-figures'
import { countGapGroups, duePreview, groupCoverage } from './overview-lists'
import { coverageOf, dailyNeedOf } from './stock-figures'

export interface OverviewPorts {
  stock: StockReader
  facts: HouseholdFactsReader
}

interface OverviewInput {
  householdId: string
  today: CalendarDay
}

/** Die Ziel-Lücke zählt am Zieldatum (A13), ohne gültiges Zieldatum heute. */
function gapReference(goal: HouseholdGoal | null, today: CalendarDay): ReferenceDay {
  const targetDay = goal?.targetDay ?? null
  return targetDay !== null && targetDay >= today
    ? { day: targetDay, kind: 'target' }
    : { day: today, kind: 'today' }
}

function coverageBlocks(
  context: ReadContext,
  units: readonly JoinedUnit[],
  goal: HouseholdGoal | null,
) {
  const input = {
    basis: context.basis,
    units: units.map(toGroupUnit),
    today: context.today,
    stillGoodCounts: context.stillGoodCounts,
  }
  const today = coverageOf(input).progress
  const atTarget = coverageOf({ ...input, reference: gapReference(goal, context.today) }).progress
  return { today, atTarget }
}

async function loadFacts(ports: OverviewPorts, { householdId, today }: OverviewInput) {
  const [goal, source, openItems, due] = await Promise.all([
    ports.facts.loadGoal(householdId),
    ports.facts.loadActiveSource(householdId),
    ports.facts.countOpenRestockItems(householdId),
    getDueUnits(ports.stock, { householdId, today, sort: 'date' }),
  ])
  return { goal, source, openItems, due }
}

async function loadStock(reader: StockReader, { householdId, today }: OverviewInput) {
  const [context, groups, products, stock] = await Promise.all([
    loadReadContext(reader, householdId, today),
    reader.loadGroups(),
    reader.loadProducts(householdId, {}),
    reader.loadUnits(householdId, { statuses: ['stock'] }),
  ])
  return { context, groups, units: joinUnits(stock, products) }
}

export async function getOverview(ports: OverviewPorts, input: OverviewInput): Promise<Overview> {
  const [{ context, groups, units }, facts] = await Promise.all([
    loadStock(ports.stock, input),
    loadFacts(ports, input),
  ])
  const head = headFigures({
    units: units.map(toNodeUnit),
    need: dailyNeedOf(context.basis),
    today: input.today,
    goal: facts.goal,
    stillGoodCounts: context.stillGoodCounts,
  })
  const coverage = coverageBlocks(context, units, facts.goal)
  return {
    hasStock: units.length > 0,
    ...head,
    due: duePreview(facts.due),
    groups: groupCoverage(coverage.today, groups),
    restock: { openItems: facts.openItems, gapGroups: countGapGroups(coverage.atTarget) },
    household: { members: context.basis.members.length, source: facts.source },
  }
}
