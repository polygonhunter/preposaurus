// Endgültiges Löschen einer Fehlerfassung (#50) in einer Transaktion. Jede Abfrage filtert auf den
// Haushalt (#133). Produkt löschen nimmt per CASCADE seine Einheiten (auch verbrauchte und
// entsorgte, also den Verlauf) und seine Fotozeilen mit. Die Fotos werden vorher gelesen, weil
// ihre Dateien danach noch weg müssen. Zuletzt verschwinden nur Erfassungen, an denen keine
// Packung mehr hängt (NOT EXISTS), so nimmt ihr CASCADE nie still einen Verlauf mit.
import 'server-only'
import { and, count, eq, inArray, notExists } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { photos } from '@/server/db/schema/capture'
import { captures } from '@/server/db/schema/confirmed-captures'
import { products, units } from '@/server/db/schema/inventory'

type Target = Readonly<{ kind: 'product'; productId: string } | { kind: 'unit'; unitId: string }>

const photoColumns = { id: photos.id, householdId: photos.householdId }

async function lockOwnProduct(tx: Database, householdId: string, productId: string) {
  const [row] = await tx
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.householdId, householdId)))
    .for('update')
  return row !== undefined
}

async function captureIdsOf(tx: Database, productId: string) {
  const rows = await tx
    .selectDistinct({ captureId: units.captureId })
    .from(units)
    .where(eq(units.productId, productId))
  return rows.map((row) => row.captureId)
}

async function deleteEmptyCaptures(tx: Database, householdId: string, captureIds: string[]) {
  if (captureIds.length === 0) return
  const unitsOfCapture = tx
    .select({ id: units.id })
    .from(units)
    .where(eq(units.captureId, captures.id))
  await tx
    .delete(captures)
    .where(
      and(
        inArray(captures.id, captureIds),
        eq(captures.householdId, householdId),
        notExists(unitsOfCapture),
      ),
    )
}

/** Produkt samt Einheiten und Fotozeilen. Liefert die Fotos, deren Dateien noch weg müssen. */
async function removeProduct(tx: Database, householdId: string, productId: string) {
  const productPhotos = await tx
    .select(photoColumns)
    .from(photos)
    .where(eq(photos.productId, productId))
  const captureIds = await captureIdsOf(tx, productId)
  await tx
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.householdId, householdId)))
  await deleteEmptyCaptures(tx, householdId, captureIds)
  return productPhotos
}

async function eraseProduct(tx: Database, householdId: string, productId: string) {
  if (!(await lockOwnProduct(tx, householdId, productId))) return null
  const erasedPhotos = await removeProduct(tx, householdId, productId)
  return { photos: erasedPhotos, isProductRemoved: true }
}

async function findOwnUnit(tx: Database, householdId: string, unitId: string) {
  const [row] = await tx
    .select({ productId: units.productId, captureId: units.captureId })
    .from(units)
    .innerJoin(products, eq(products.id, units.productId))
    .where(and(eq(units.id, unitId), eq(products.householdId, householdId)))
  return row ?? null
}

async function countUnitsOf(tx: Database, productId: string) {
  const [row] = await tx
    .select({ total: count() })
    .from(units)
    .where(eq(units.productId, productId))
  return row?.total ?? 0
}

/** Eine Packung. War es die letzte des Produkts (auch im Verlauf), geht das Produkt mit. */
async function eraseUnit(tx: Database, householdId: string, unitId: string) {
  const unit = await findOwnUnit(tx, householdId, unitId)
  if (unit === null || !(await lockOwnProduct(tx, householdId, unit.productId))) return null
  const unitPhotos = await tx
    .delete(photos)
    .where(eq(photos.unitId, unitId))
    .returning(photoColumns)
  await tx.delete(units).where(eq(units.id, unitId))
  if ((await countUnitsOf(tx, unit.productId)) > 0) {
    await deleteEmptyCaptures(tx, householdId, [unit.captureId])
    return { photos: unitPhotos, isProductRemoved: false }
  }
  const productPhotos = await removeProduct(tx, householdId, unit.productId)
  await deleteEmptyCaptures(tx, householdId, [unit.captureId])
  return { photos: [...unitPhotos, ...productPhotos], isProductRemoved: true }
}

function eraseRows(db: Database, householdId: string, target: Target) {
  return db.transaction((tx) =>
    target.kind === 'product'
      ? eraseProduct(tx, householdId, target.productId)
      : eraseUnit(tx, householdId, target.unitId),
  )
}

export function createEntryEraseRepository(db: Database) {
  return {
    eraseRows: (householdId: string, target: Target) => eraseRows(db, householdId, target),
  }
}
