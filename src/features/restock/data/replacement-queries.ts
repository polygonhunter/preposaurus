// Lesepfade für die live gerechneten Teile der Nachkaufen-Liste: Packungen für „Ersetzen“ (A14,
// #200) und Lebensmittelarten für die Beispiele an den Lücken (#202). Jede Abfrage filtert auf
// haushalt_id (#133); System-Arten gehören keinem Haushalt und gelten für alle.
import 'server-only'
import { and, asc, eq, gte, isNull, or } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { categories } from '@/server/db/schema/catalog'
import { foodTypes } from '@/server/db/schema/food-types'
import { products, units } from '@/server/db/schema/inventory'
import { productGroups } from '@/server/db/schema/recommendation'
import { addDays, todayInBerlin, toCalendarDay, type CalendarDay } from '@/shared/lib/dates'
import type { GroupFoodType } from '../domain/gap-examples'
import type { ReplacementUnit } from '../domain/replacement-candidates'

const STOCK = 'vorrat'
const CONSUMED = 'verbraucht'

type UnitRow = Readonly<{
  productId: string
  productName: string
  foodTypeId: string | null
  foodTypeName: string | null
  status: string
  bestBefore: string | null
  takenAt: Date | null
}>

// Zeile wie im Vorrat: die Lebensmittelart, ohne Art das Produkt selbst
function toReplacementUnit(row: UnitRow): ReplacementUnit {
  return {
    productId: row.productId,
    rowKey: row.foodTypeId === null ? `product:${row.productId}` : `food-type:${row.foodTypeId}`,
    label: row.foodTypeName ?? row.productName,
    status: row.status === STOCK ? 'stock' : 'consumed',
    bestBefore: row.bestBefore === null ? null : toCalendarDay(row.bestBefore),
    takenOn: row.takenAt === null ? null : todayInBerlin(row.takenAt),
  }
}

/** Ab Mitternacht UTC einen Tag vorher: großzügig, die Fachlogik grenzt in Berlin genau ab. */
const startOfDayBefore = (day: CalendarDay) => new Date(`${addDays(day, -1)}T00:00:00Z`)

export async function listReplacementUnits(
  db: Database,
  householdId: string,
  consumedSince: CalendarDay,
): Promise<ReplacementUnit[]> {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      foodTypeId: products.foodTypeId,
      foodTypeName: foodTypes.name,
      status: units.status,
      bestBefore: units.bestBefore,
      takenAt: units.takenAt,
    })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .leftJoin(foodTypes, eq(foodTypes.id, products.foodTypeId))
    .where(
      and(
        eq(products.householdId, householdId),
        or(
          eq(units.status, STOCK),
          and(eq(units.status, CONSUMED), gte(units.takenAt, startOfDayBefore(consumedSince))),
        ),
      ),
    )
  return rows.map(toReplacementUnit)
}

async function listStockedFoodTypeIds(db: Database, householdId: string) {
  const rows = await db
    .selectDistinct({ id: products.foodTypeId })
    .from(products)
    .innerJoin(units, eq(units.productId, products.id))
    .where(and(eq(products.householdId, householdId), eq(units.status, STOCK)))
  return new Set(rows.map(({ id }) => id))
}

const usableBy = (householdId: string) =>
  and(
    or(isNull(foodTypes.householdId), eq(foodTypes.householdId, householdId)),
    eq(foodTypes.isHidden, false),
    eq(categories.isHidden, false),
  )

/** Lebensmittelarten in der Reihenfolge des Katalogs, mit „schon im Vorrat“. */
export async function listGroupFoodTypes(
  db: Database,
  householdId: string,
): Promise<GroupFoodType[]> {
  const [rows, stocked] = await Promise.all([
    db
      .select({ id: foodTypes.id, name: foodTypes.name, groupKey: productGroups.key })
      .from(foodTypes)
      .innerJoin(categories, eq(categories.id, foodTypes.categoryId))
      .innerJoin(productGroups, eq(productGroups.id, categories.productGroupId))
      .where(usableBy(householdId))
      .orderBy(
        asc(categories.sortOrder),
        asc(foodTypes.isSystem),
        asc(foodTypes.sortOrder),
        asc(foodTypes.name),
      ),
    listStockedFoodTypeIds(db, householdId),
  ])
  return rows.map(({ id, name, groupKey }) => ({ groupKey, name, isStocked: stocked.has(id) }))
}
