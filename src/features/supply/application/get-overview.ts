// Use-Case Übersicht (#67, UX-Konzept §8.1): lädt Bestand, Mitglieder, Quelle und Ziel einmal und
// liefert ein schmales DTO für alle Blöcke der Startseite. Gerechnet wird nur in der Fachlogik
// (supply/domain, über stock-figures und die Lesepfade des Vorrats), die UI formatiert nur noch.
import 'server-only'
import { getDueUnits } from '@/features/inventory/application/get-due-units'
import type { ReadContext } from '@/features/inventory/application/read-context'
import type { StockReader } from '@/features/inventory/application/stock-reader'
import {
  toGroupUnit,
  toNodeUnit,
  type JoinedUnit,
} from '@/features/inventory/application/stock-model'
import type { Overview } from '../schemas'
import type { HouseholdFactsReader, HouseholdGoal } from './household-facts-reader'
import { satietyByGroup } from './group-satiety'
import { explanationBasisOf } from './overview-explanation'
import { headFigures } from './overview-figures'
import { countGapGroups, duePreview, groupCoverage } from './overview-lists'
import { coverageOf, dailyNeedOf } from './stock-figures'
import { loadStockSnapshot, progressAtTarget, type HouseholdDay } from './stock-snapshot'

export interface OverviewPorts {
  stock: StockReader
  facts: HouseholdFactsReader
  /** Die eine Zählung offener Nachkaufen-Einträge, dieselbe wie in der Wochenübersicht (#202) */
  countOpenRestockItems: (householdId: string) => Promise<number>
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
  return { today: coverageOf(input).progress, atTarget: progressAtTarget(context, units, goal) }
}

async function loadFacts(ports: OverviewPorts, { householdId, today }: HouseholdDay) {
  const [goal, source, openItems, due] = await Promise.all([
    ports.facts.loadGoal(householdId),
    ports.facts.loadActiveSource(householdId),
    ports.countOpenRestockItems(householdId),
    getDueUnits(ports.stock, { householdId, today, sort: 'date' }),
  ])
  return { goal, source, openItems, due }
}

export async function getOverview(ports: OverviewPorts, input: HouseholdDay): Promise<Overview> {
  const [{ context, groups, units }, facts] = await Promise.all([
    loadStockSnapshot(ports.stock, input),
    loadFacts(ports, input),
  ])
  const figures = {
    units: units.map(toNodeUnit),
    need: dailyNeedOf(context.basis),
    today: input.today,
    stillGoodCounts: context.stillGoodCounts,
  }
  const head = headFigures({
    ...figures,
    goal: facts.goal,
    explanation: explanationBasisOf(
      context,
      units.map(({ unit }) => unit),
    ),
  })
  const coverage = coverageBlocks(context, units, facts.goal)
  return {
    hasStock: units.length > 0,
    ...head,
    due: duePreview(facts.due),
    groups: groupCoverage(
      coverage.today,
      groups,
      satietyByGroup(
        figures,
        groups.map(({ key }) => key),
      ),
    ),
    restock: { openItems: facts.openItems, gapGroups: countGapGroups(coverage.atTarget) },
    household: { members: context.basis.members.length, source: facts.source },
  }
}
