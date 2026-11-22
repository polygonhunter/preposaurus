// Grundausstattung für Integrationstests: Stammdaten, ein Haushalt, ein Nutzer, ein Produkt.
// Baut auf denselben Fabriken auf wie die Demo.
import { eq } from 'drizzle-orm'
import { seedMasterData } from '../../db/seeds/master-data'
import type { Database } from '../../src/server/db/connection'
import { users } from '../../src/server/db/schema/account'
import { categories } from '../../src/server/db/schema/catalog'
import { households } from '../../src/server/db/schema/household'
import { products } from '../../src/server/db/schema/inventory'
import { buildHousehold, buildProduct, buildUser } from '../../db/seeds/factories'

export type Basics = Readonly<{
  householdId: string
  userId: string
  categoryId: string
  productId: string
}>

export async function insertBasics(db: Database): Promise<Basics> {
  await seedMasterData(db)
  const [category] = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.key, 'getreide'))
  if (category === undefined) throw new Error('System-Kategorie getreide fehlt')
  const household = buildHousehold()
  await db.insert(households).values(household)
  const user = buildUser({ householdId: household.id, role: 'admin' })
  await db.insert(users).values(user)
  const product = buildProduct({ householdId: household.id, categoryId: category.id })
  await db.insert(products).values(product)
  return {
    householdId: household.id,
    userId: user.id,
    categoryId: category.id,
    productId: product.id,
  }
}
