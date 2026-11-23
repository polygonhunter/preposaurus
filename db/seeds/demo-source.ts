// Erfundene Empfehlungsquelle für den Beispielhaushalt (Entwicklung und Integrationstests der
// Übersicht). Feste Testzahlen, unabhängig von der echten Quelle BBK/BLE (quellen/bbk-ble.ts), die
// sich mit der Prüfung durch den Maintainer noch ändern kann.
// Nie im Betrieb: Aufrufer sind nur Integrationstests und `npm run db:seed:demo` (von Hand, nicht im
// Container). Die E2E-Tests nutzen die echte Quelle BBK/BLE aus dem regulären Seed.
import { eq } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { households } from '../../src/server/db/schema/household'
import {
  productGroups,
  sourceNeeds,
  sources,
  sourceValues,
  sourceVersions,
} from '../../src/server/db/schema/recommendation'
import type { MEMBER_TYPES } from '../../src/shared/config/constants'
import type { ProductGroupKey } from './stammdaten/warengruppen'

export const DEMO_SOURCE = {
  key: 'beispielquelle',
  name: 'Beispielquelle (erfunden)',
  asOf: '2026-11',
  link: 'https://example.org/beispielquelle',
} as const

const DEMO_NEEDS: Record<(typeof MEMBER_TYPES)[number], { kcal: string; waterMl: number }> = {
  baby: { kcal: '800', waterMl: 1000 },
  kind: { kcal: '1600', waterMl: 1500 },
  jugendlich: { kcal: '2400', waterMl: 2000 },
  erwachsen: { kcal: '2200', waterMl: 2000 },
  senior: { kcal: '2000', waterMl: 2000 },
}

// Menge je Person und Tag. Sonstiges zählt nur über die kcal und hat deshalb keinen Wert.
const DEMO_VALUES: Partial<Record<ProductGroupKey, { amount: string; unit: 'g' | 'ml' }>> = {
  getreide: { amount: '350', unit: 'g' },
  gemuese_huelsenfruechte: { amount: '400', unit: 'g' },
  obst_nuesse: { amount: '250', unit: 'g' },
  milch: { amount: '260', unit: 'ml' },
  fleisch_fisch_eier: { amount: '150', unit: 'g' },
  fette_oele: { amount: '35', unit: 'g' },
  wasser: { amount: '2000', unit: 'ml' },
}

async function insertVersion(db: Database): Promise<string> {
  const [source] = await db
    .insert(sources)
    .values({ key: DEMO_SOURCE.key, name: DEMO_SOURCE.name, country: 'DE' })
    .returning({ id: sources.id })
  if (source === undefined) throw new Error('Quelle wurde nicht angelegt')
  const [version] = await db
    .insert(sourceVersions)
    .values({
      sourceId: source.id,
      asOf: DEMO_SOURCE.asOf,
      link: DEMO_SOURCE.link,
      defaultDays: 10,
    })
    .returning({ id: sourceVersions.id })
  if (version === undefined) throw new Error('Quellfassung wurde nicht angelegt')
  return version.id
}

async function insertValues(db: Database, versionId: string) {
  const groups = await db
    .select({ id: productGroups.id, key: productGroups.key })
    .from(productGroups)
  const rows = groups.flatMap(({ id, key }) => {
    const value = DEMO_VALUES[key as ProductGroupKey]
    if (value === undefined) return []
    return [
      {
        sourceVersionId: versionId,
        productGroupId: id,
        amountPerPersonDay: value.amount,
        unit: value.unit,
      },
    ]
  })
  await db.insert(sourceValues).values(rows)
}

/** Legt die erfundene Quelle an und macht sie für den Haushalt aktiv. Braucht die Stammdaten. */
export async function seedDemoSource(db: Database, householdId: string): Promise<void> {
  const versionId = await insertVersion(db)
  await db.insert(sourceNeeds).values(
    Object.entries(DEMO_NEEDS).map(([personGroup, need]) => ({
      sourceVersionId: versionId,
      personGroup: personGroup as (typeof MEMBER_TYPES)[number],
      kcalPerDay: need.kcal,
      waterMlPerDay: need.waterMl,
    })),
  )
  await insertValues(db, versionId)
  await db
    .update(households)
    .set({ activeSourceVersionId: versionId })
    .where(eq(households.id, householdId))
}
