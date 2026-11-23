// „Datum ändern“ für eine Datumszeile im Detail (#49, #116): Aus einer Packung wird die ganze
// Zeile, also alle Packungen desselben Produkts im Vorrat mit demselben Datum (gleicher Schlüssel
// wie `bestBeforeGroupsOf`). Die ID kommt ungeprüft aus der Adresse.
import 'server-only'
import { bestBeforeKeyOf } from '../domain/group-units'
import { err, ok, type Result } from '@/shared/lib/result'
import type { UnitDateGroup } from '../schemas/detail'
import { unitIdSchema } from '../schemas/requests'
import type { NotFound } from './read-context'
import type { UnitDateEditor, UnitDateSource } from './unit-date-editor'

const targetOf = ({ product }: UnitDateSource): UnitDateGroup['target'] =>
  product.foodType === null
    ? { kind: 'product', id: product.id }
    : { kind: 'food-type', id: product.foodType.id }

export async function getUnitDateGroup(
  editor: Pick<UnitDateEditor, 'loadSource'>,
  input: Readonly<{ householdId: string; unitId: string }>,
): Promise<Result<UnitDateGroup, NotFound>> {
  const parsed = unitIdSchema.safeParse(input.unitId)
  if (!parsed.success) return err({ kind: 'not-found' })
  const source = await editor.loadSource(input.householdId, parsed.data)
  const unit = source?.stockUnits.find((candidate) => candidate.id === parsed.data)
  if (source === null || unit === undefined) return err({ kind: 'not-found' })
  const key = bestBeforeKeyOf(unit.bestBefore)
  const members = source.stockUnits.filter((other) => bestBeforeKeyOf(other.bestBefore) === key)
  return ok({
    target: targetOf(source),
    name: source.product.foodType?.name ?? source.product.name,
    productName: source.product.name,
    bestBefore: unit.bestBefore,
    kind: unit.kind,
    unitIds: members.map((member) => member.id),
    checkedCount: members.filter((member) => member.checkedAt !== null).length,
  })
}
