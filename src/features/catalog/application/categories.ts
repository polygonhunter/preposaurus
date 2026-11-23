// Kategorien verwalten (EIN-04, #76): lesen dürfen alle im Haushalt, ändern nur der Admin (die
// Actions prüfen das). Eigene Kategorien braucht eine Warengruppe, damit der Rechner sie zählt.
// System-Kategorien lassen sich nur je Haushalt ausblenden, nie ändern oder löschen.
import 'server-only'
import { err, ok, type Result } from '@/shared/lib/result'
import { findNameConflict } from '../domain/catalog-name'
import type { CategoryEntry, ProductGroup } from '../domain/category'
import type { CategoryInput } from '../schemas'
import type { CatalogServices } from './catalog-services'
import type { NameError } from './storage-locations'

type Deps = Pick<CatalogServices, 'categories'>

type Target = Readonly<{ householdId: string; id: string }>

export type CategoryError =
  NameError | { kind: 'unknown-group' } | { kind: 'not-found' } | { kind: 'system-not-editable' }

export type CategoryOverview = Readonly<{ groups: ProductGroup[]; categories: CategoryEntry[] }>

export async function getCategoryOverview(
  deps: Deps,
  householdId: string,
): Promise<CategoryOverview> {
  const [groups, categories] = await Promise.all([
    deps.categories.listGroups(),
    deps.categories.list(householdId),
  ])
  return { groups, categories }
}

async function findCategory(deps: Deps, { householdId, id }: Target) {
  const categories = await deps.categories.list(householdId)
  return categories.find((category) => category.id === id) ?? null
}

async function checkInput(
  deps: Deps,
  {
    householdId,
    id,
    input,
  }: Readonly<{ householdId: string; id: string | null; input: CategoryInput }>,
): Promise<CategoryError | null> {
  const [groups, categories] = await Promise.all([
    deps.categories.listGroups(),
    deps.categories.list(householdId),
  ])
  if (!groups.some((group) => group.id === input.productGroupId)) return { kind: 'unknown-group' }
  if (id !== null) {
    const current = categories.find((category) => category.id === id)
    if (current === undefined) return { kind: 'not-found' }
    if (current.isSystem) return { kind: 'system-not-editable' }
  }
  const conflict = findNameConflict(categories, input.name, id)
  return conflict === null ? null : { kind: 'duplicate', isHidden: conflict.isHidden }
}

/** Legt eine eigene Kategorie an (id null) oder ändert eine eigene. */
export async function saveCategory(
  deps: Deps,
  command: Readonly<{ householdId: string; id: string | null; input: CategoryInput }>,
): Promise<Result<{ id: string }, CategoryError>> {
  const problem = await checkInput(deps, command)
  if (problem !== null) return err(problem)
  const { householdId, id, input } = command
  if (id === null) {
    const created = await deps.categories.create(householdId, input)
    return created === null ? err({ kind: 'duplicate', isHidden: false }) : ok({ id: created })
  }
  const isUpdated = await deps.categories.update(householdId, id, input)
  return isUpdated ? ok({ id }) : err({ kind: 'not-found' })
}

/** Blendet eine System- oder eigene Kategorie für diesen Haushalt aus oder wieder ein. */
export async function setCategoryHidden(
  deps: Deps,
  { householdId, id, isHidden }: Target & Readonly<{ isHidden: boolean }>,
): Promise<Result<null, { kind: 'not-found' }>> {
  const category = await findCategory(deps, { householdId, id })
  // Vom Seed entfernte Kategorien bleiben ausgeblendet, der Haushalt kann sie nicht zurückholen.
  if (category === null || category.isRetired) return err({ kind: 'not-found' })
  await deps.categories.setHidden(householdId, id, isHidden)
  return ok(null)
}

export async function removeCategory(
  deps: Deps,
  target: Target,
): Promise<Result<null, { kind: 'not-found' } | { kind: 'in-use' }>> {
  const outcome = await deps.categories.remove(target.householdId, target.id)
  return outcome === 'removed' ? ok(null) : err({ kind: outcome })
}
