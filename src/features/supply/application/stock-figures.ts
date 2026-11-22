// Kennzahlen für die Lesepfade des Vorrats (#43): Summen je Baumknoten, Tagesbedarf und
// Abdeckung je Warengruppe. Hier wird nur zusammengesetzt, gerechnet wird in supply/domain.
import 'server-only'
import type { CalendarDay } from '@/shared/lib/dates'
import { calculateDailyNeed, type DailyNeed } from '../domain/daily-need'
import {
  calculateGroupProgress,
  findTightestGroup,
  type GroupProgress,
  type GroupUnit,
} from '../domain/group-progress'
import {
  calculateHouseholdTargets,
  resolveDiet,
  type Diet,
  type DietShifts,
  type HouseholdGroupTarget,
} from '../domain/group-targets'
import {
  calculateNodeTotals,
  type NodeTotals,
  type NodeUnit,
  type TreeNode,
} from '../domain/node-totals'
import type { SupplyBasis } from '../domain/supply-basis'

type Need = Pick<DailyNeed, 'kcalPerDay' | 'waterMlPerDay'>

interface FiguresInput {
  units: readonly NodeUnit[]
  need: Need
  today: CalendarDay
  /** Haushalts-Einstellung „Noch gut zählt mit“ (#117) */
  stillGoodCounts: boolean
}

/** Summen je Knoten am heutigen Tag, in der Reihenfolge der Knoten. */
export function totalsForNodes(
  input: FiguresInput,
  nodes: readonly TreeNode[],
): { node: TreeNode; totals: NodeTotals }[] {
  const { units, need, today, stillGoodCounts } = input
  const reference = { day: today, kind: 'today' } as const
  return nodes.map((node) => ({
    node,
    totals: calculateNodeTotals({ units, need, reference, stillGoodCounts, node }),
  }))
}

/** Tagesbedarf des Haushalts. Ohne aktive Quelle 0, dann gibt es keine Tage (null). */
export function dailyNeedOf(basis: SupplyBasis): Need {
  const { kcalPerDay, waterMlPerDay } = calculateDailyNeed(basis.members, basis.needs)
  return { kcalPerDay, waterMlPerDay }
}

// quelle_wert speichert die Menge je Ernährungsform schon verteilt. Deshalb ohne Verschiebung.
const NO_SHIFTS: DietShifts = { omnivore: [], vegetarian: [], vegan: [] }
const DIETS: readonly Diet[] = ['omnivore', 'vegetarian', 'vegan']

function targetsForDiet(basis: SupplyBasis, diet: Diet, days: number): HouseholdGroupTarget[] {
  const members = basis.members.filter(
    (member) => resolveDiet(member, basis.householdDiet) === diet,
  )
  // Fehlen Werte für eine Form, gilt vorläufig „alles“, damit niemand ohne Ziel bleibt
  const targets = basis.targetsByDiet[diet] ?? basis.targetsByDiet.omnivore ?? []
  if (members.length === 0) return []
  const result = calculateHouseholdTargets({
    members,
    householdDiet: basis.householdDiet,
    targets,
    dietShifts: NO_SHIFTS,
    days,
  })
  return result.ok ? result.value : []
}

function householdTargets(basis: SupplyBasis, days: number): HouseholdGroupTarget[] {
  const totals = new Map<string, HouseholdGroupTarget>()
  for (const target of DIETS.flatMap((diet) => targetsForDiet(basis, diet, days))) {
    const existing = totals.get(target.groupKey)
    if (existing) existing.amount += target.amount
    else totals.set(target.groupKey, { ...target })
  }
  return [...totals.values()]
}

interface CoverageInput {
  basis: SupplyBasis
  units: readonly GroupUnit[]
  today: CalendarDay
  stillGoodCounts: boolean
}

export interface GroupCoverage {
  progress: GroupProgress[]
  tightestGroupKey: string | null
}

/** „X von Y Tagen“ je Warengruppe am heutigen Tag. Ohne Ziel oder Quelle bleibt sie leer. */
export function coverageOf({ basis, units, today, stillGoodCounts }: CoverageInput): GroupCoverage {
  if (basis.goalDays === null) return { progress: [], tightestGroupKey: null }
  const progress = calculateGroupProgress({
    units,
    targets: householdTargets(basis, basis.goalDays),
    goalDays: basis.goalDays,
    reference: { day: today, kind: 'today' },
    stillGoodCounts,
  })
  return { progress, tightestGroupKey: findTightestGroup(progress)?.groupKey ?? null }
}
