// Fakes der Kategorie- und Art-Repositories für die Use-Case-Tests (#76, #126).
// Wie die echten Repositories antworten sie nur mit den übergebenen Einträgen.
import type { CategoryEntry, FoodTypeEntry } from '../../src/features/catalog/domain/category'

type RemoveOutcome = 'removed' | 'in-use' | 'not-found'

export const GROUP = { id: 'g-getreide', name: 'Getreide' }

export const category = (id: string, extra: Partial<CategoryEntry> = {}): CategoryEntry => ({
  id,
  name: id,
  isSystem: false,
  isHidden: false,
  isRetired: false,
  productGroupId: GROUP.id,
  productGroupName: GROUP.name,
  foodTypeCount: 0,
  productCount: 0,
  ...extra,
})

export const foodType = (id: string, extra: Partial<FoodTypeEntry> = {}): FoodTypeEntry => ({
  id,
  key: `eigen_${id}`,
  name: id,
  isSystem: false,
  isHidden: false,
  isRetired: false,
  categoryId: 'nudeln',
  categoryName: 'Nudeln',
  productGroupName: GROUP.name,
  isCategoryHidden: false,
  searchTerms: [],
  kcalPer100: null,
  proteinPer100: null,
  carbsPer100: null,
  fatPer100: null,
  typicalShelfLifeMonths: null,
  productCount: 0,
  ...extra,
})

export function fakeCatalog(categories: CategoryEntry[], foodTypes: FoodTypeEntry[] = []) {
  const calls: string[] = []
  const categoryRepository = {
    listGroups: () => Promise.resolve([GROUP]),
    list: () => Promise.resolve(categories),
    create: (_household: string, values: { name: string }) => {
      calls.push(`create-category:${values.name}`)
      return Promise.resolve('neu')
    },
    update: (_household: string, id: string) =>
      Promise.resolve(categories.some((entry) => entry.id === id)),
    setHidden: (_household: string, id: string, isHidden: boolean) => {
      calls.push(`hide-category:${id}:${String(isHidden)}`)
      return Promise.resolve()
    },
    remove: (): Promise<RemoveOutcome> => Promise.resolve('removed'),
  }
  const foodTypeRepository = {
    list: () => Promise.resolve(foodTypes),
    listOwnKeys: () => Promise.resolve(foodTypes.map((entry) => entry.key)),
    create: (_household: string, values: { key: string; searchTerms: readonly string[] }) => {
      calls.push(`create-food-type:${values.key}:${values.searchTerms.join('|')}`)
      return Promise.resolve('neu')
    },
    update: (_household: string, id: string) =>
      Promise.resolve(foodTypes.some((entry) => entry.id === id)),
    setHidden: (_household: string, id: string, isHidden: boolean) => {
      calls.push(`hide-food-type:${id}:${String(isHidden)}`)
      return Promise.resolve()
    },
    remove: (): Promise<RemoveOutcome> => Promise.resolve('in-use'),
    saveOrder: (_household: string, ids: readonly string[]) => {
      calls.push(`order-food-types:${ids.join('|')}`)
      return Promise.resolve()
    },
  }
  return { deps: { categories: categoryRepository, foodTypes: foodTypeRepository }, calls }
}
