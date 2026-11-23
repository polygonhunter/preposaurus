// Gemeinsamer Rahmen jeder Leseabfrage: Stichtag, Schwellen und Schalter aus
// haushalt_einstellung, Tagesbedarf für den Beitrag in Tagen. Dazu die Summen je Knoten.
import 'server-only'
import { dailyNeedOf, totalsForNodes } from '@/features/supply/application/stock-figures'
import type { NodeTotals, TreeNode } from '@/features/supply/domain/node-totals'
import type { SupplyBasis } from '@/features/supply/domain/supply-basis'
import type { CalendarDay } from '@/shared/lib/dates'
import type { StateContext } from '../domain/stock-filter'
import { unitStateFor } from '../domain/unit-state'
import type { NodeTotalsDto } from '../schemas/shared'
import type { StockReader } from './stock-reader'
import { toNodeUnit, type JoinedUnit } from './stock-model'

/** Fremde oder unbekannte IDs ergeben not-found, nie forbidden (DATENKATALOG §8 Nr. 3). */
export interface NotFound {
  kind: 'not-found'
}

export interface ReadContext extends StateContext {
  stillGoodCounts: boolean
  basis: SupplyBasis
}

/** Liest Einstellungen und Bedarfsgrundlage des Haushalts für den Stichtag `today`. */
export async function loadReadContext(
  reader: StockReader,
  householdId: string,
  today: CalendarDay,
): Promise<ReadContext> {
  const [settings, basis] = await Promise.all([
    reader.loadSettings(householdId),
    reader.loadSupplyBasis(householdId),
  ])
  return { today, ...settings, basis }
}

function toTotalsDto(totals: NodeTotals, context: StateContext): NodeTotalsDto {
  const { nextBestBefore } = totals
  const nextState =
    nextBestBefore === null ? null : unitStateFor({ ...context, bestBefore: nextBestBefore.date })
  return { ...totals, nextState }
}

const nodeId = (node: TreeNode) => `${node.level}:${node.key}`

/**
 * Summen für mehrere Knoten auf einmal, als DTO. Gerechnet wird mit `calculateNodeTotals`, der
 * Schlüssel ist Ebene und Knoten („foodType:food-type:…“).
 */
export function totalsByNode(
  context: ReadContext,
  units: readonly JoinedUnit[],
  nodes: readonly TreeNode[],
): Map<string, NodeTotalsDto> {
  const input = {
    units: units.map(toNodeUnit),
    need: dailyNeedOf(context.basis),
    today: context.today,
    stillGoodCounts: context.stillGoodCounts,
  }
  return new Map(
    totalsForNodes(input, nodes).map(({ node, totals }) => [
      nodeId(node),
      toTotalsDto(totals, context),
    ]),
  )
}

/** Holt die Summen eines Knotens, der vorher in `totalsByNode` stand. */
export function totalsOf(
  totals: ReadonlyMap<string, NodeTotalsDto>,
  node: TreeNode,
): NodeTotalsDto {
  const found = totals.get(nodeId(node))
  if (found === undefined) throw new Error(`Summen für ${nodeId(node)} fehlen`)
  return found
}
