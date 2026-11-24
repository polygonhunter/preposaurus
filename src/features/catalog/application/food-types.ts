// Lebensmittelarten verwalten (#126): lesen dürfen alle im Haushalt, ändern nur der Admin. Eigene
// Arten brauchen eine Kategorie, die der Haushalt wählen kann. Der Name darf weder eine eigene noch
// eine System-Art doppeln, sonst stünden beim Erfassen zwei gleiche Treffer da. System-Arten lassen
// sich nur je Haushalt ausblenden.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { findNameConflict } from '../domain/catalog-name'
import { ownSiblingIds, type FoodTypeEntry } from '../domain/category'
import { uniqueOwnKey } from '../domain/own-key'
import { moveInOrder, type MoveDirection } from '../domain/sort-order'
import type { FoodTypeInput } from '../schemas'
import type { CatalogServices } from './catalog-services'
import type { NameError } from './storage-locations'

type Deps = Pick<CatalogServices, 'categories' | 'foodTypes'>

type Target = Readonly<{ householdId: string; id: string }>

export type FoodTypeError =
  NameError | { kind: 'unknown-category' } | { kind: 'not-found' } | { kind: 'system-not-editable' }

type SaveCommand = Readonly<{ householdId: string; id: string | null; input: FoodTypeInput }>

export async function listFoodTypes(
  deps: Pick<Deps, 'foodTypes'>,
  householdId: string,
): Promise<FoodTypeEntry[]> {
  return deps.foodTypes.list(householdId)
}

export async function findFoodType(deps: Pick<Deps, 'foodTypes'>, { householdId, id }: Target) {
  const foodTypes = await deps.foodTypes.list(householdId)
  return foodTypes.find((foodType) => foodType.id === id) ?? null
}

async function checkInput(deps: Deps, { householdId, id, input }: SaveCommand) {
  const [categories, foodTypes] = await Promise.all([
    deps.categories.list(householdId),
    deps.foodTypes.list(householdId),
  ])
  const category = categories.find((entry) => entry.id === input.categoryId)
  const current = id === null ? null : foodTypes.find((entry) => entry.id === id)
  // Die bisherige Kategorie bleibt wählbar, auch wenn sie inzwischen ausgeblendet ist.
  const isCategoryAllowed =
    category !== undefined && (!category.isHidden || current?.categoryId === category.id)
  if (!isCategoryAllowed) return err({ kind: 'unknown-category' } as const)
  if (current === undefined) return err({ kind: 'not-found' } as const)
  if (current?.isSystem === true) return err({ kind: 'system-not-editable' } as const)
  const conflict = findNameConflict(foodTypes, input.name, id)
  if (conflict !== null) return err({ kind: 'duplicate', isHidden: conflict.isHidden } as const)
  return ok(null)
}

/** Legt eine eigene Art an (id null) oder ändert eine eigene. */
export async function saveFoodType(
  deps: Deps,
  command: SaveCommand,
): Promise<Result<{ id: string }, FoodTypeError>> {
  const checked = await checkInput(deps, command)
  if (!checked.ok) return checked
  const { householdId, id, input } = command
  if (id === null) {
    const key = uniqueOwnKey(input.name, new Set(await deps.foodTypes.listOwnKeys(householdId)))
    const created = await deps.foodTypes.create(householdId, { ...input, key })
    return created === null ? err({ kind: 'duplicate', isHidden: false }) : ok({ id: created })
  }
  const isUpdated = await deps.foodTypes.update(householdId, id, input)
  return isUpdated ? ok({ id }) : err({ kind: 'not-found' })
}

/** Blendet eine System- oder eigene Art für diesen Haushalt aus oder wieder ein. */
export async function setFoodTypeHidden(
  deps: Pick<Deps, 'foodTypes'>,
  { householdId, id, isHidden }: Target & Readonly<{ isHidden: boolean }>,
): Promise<Result<null, { kind: 'not-found' }>> {
  const foodType = await findFoodType(deps, { householdId, id })
  if (foodType === null || foodType.isRetired) return err({ kind: 'not-found' })
  await deps.foodTypes.setHidden(householdId, id, isHidden)
  return ok(null)
}

export async function removeFoodType(
  deps: Pick<Deps, 'foodTypes'>,
  target: Target,
): Promise<Result<null, { kind: 'not-found' } | { kind: 'in-use' }>> {
  const outcome = await deps.foodTypes.remove(target.householdId, target.id)
  return outcome === 'removed' ? ok(null) : err({ kind: outcome })
}

/** Rückt eine eigene Art unter den eigenen Arten ihrer Kategorie eine Stelle weiter (#243). */
export async function moveFoodType(
  deps: Pick<Deps, 'foodTypes'>,
  { householdId, id, direction }: Target & Readonly<{ direction: MoveDirection }>,
): Promise<void> {
  const siblings = ownSiblingIds(await deps.foodTypes.list(householdId), id)
  const order = siblings === null ? null : moveInOrder(siblings, id, direction)
  if (order !== null) await deps.foodTypes.saveOrder(householdId, order)
}
