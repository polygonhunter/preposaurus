// Spielt die Empfehlungsquelle BBK/BLE samt Fassung, Bedarf und Mengen per Upsert ein (M1-09).
// Beliebig oft wiederholbar: Quelle über den Schlüssel, Fassung über Quelle und Stand, Bedarf und
// Mengen über ihre Eindeutigkeit. Die Werte selbst stehen in quellen/bbk-ble.ts.
// Haushalte ohne aktive Quelle (angelegt, bevor es den Seed gab) bekommen diese Fassung. Eine
// schon gewählte Quelle bleibt unangetastet.
import { isNull, sql } from 'drizzle-orm'
import type { Database } from '../../src/server/db/connection'
import { households } from '../../src/server/db/schema/household'
import {
  sourceNeeds,
  sources,
  sourceValues,
  sourceVersions,
} from '../../src/server/db/schema/recommendation'
import type { MEMBER_TYPES } from '../../src/shared/config/constants'
import { BBK_BLE_NEEDS, BBK_BLE_SOURCE, BBK_BLE_VALUES, BBK_BLE_VERSION } from './quellen/bbk-ble'

const fromExcluded = (column: string) => sql.raw(`excluded."${column}"`)

async function upsertVersion(db: Database): Promise<string> {
  const [source] = await db
    .insert(sources)
    .values(BBK_BLE_SOURCE)
    .onConflictDoUpdate({
      target: sources.key,
      set: { name: fromExcluded('name'), country: fromExcluded('land') },
    })
    .returning({ id: sources.id })
  if (source === undefined) throw new Error('Quelle wurde nicht angelegt')
  const [version] = await db
    .insert(sourceVersions)
    .values({ sourceId: source.id, ...BBK_BLE_VERSION })
    .onConflictDoUpdate({
      target: [sourceVersions.sourceId, sourceVersions.asOf],
      set: {
        link: fromExcluded('link'),
        defaultDays: fromExcluded('standard_tage'),
        isVerified: fromExcluded('geprueft'),
      },
    })
    .returning({ id: sourceVersions.id })
  if (version === undefined) throw new Error('Quellfassung wurde nicht angelegt')
  return version.id
}

async function upsertNeeds(db: Database, versionId: string) {
  const rows = Object.entries(BBK_BLE_NEEDS).map(([personGroup, need]) => ({
    sourceVersionId: versionId,
    personGroup: personGroup as (typeof MEMBER_TYPES)[number],
    kcalPerDay: need.kcal,
    waterMlPerDay: need.waterMl,
  }))
  await db
    .insert(sourceNeeds)
    .values(rows)
    .onConflictDoUpdate({
      target: [sourceNeeds.sourceVersionId, sourceNeeds.personGroup],
      set: { kcalPerDay: fromExcluded('kcal_tag'), waterMlPerDay: fromExcluded('wasser_ml_tag') },
    })
}

async function upsertValues(db: Database, versionId: string, groupIds: Map<string, string>) {
  const rows = Object.entries(BBK_BLE_VALUES).flatMap(([diet, values]) =>
    Object.entries(values).map(([groupKey, value]) => {
      const productGroupId = groupIds.get(groupKey)
      if (productGroupId === undefined) throw new Error(`Warengruppe ${groupKey} fehlt im Seed`)
      return {
        sourceVersionId: versionId,
        productGroupId,
        diet: diet as keyof typeof BBK_BLE_VALUES,
        amountPerPersonDay: value.amount,
        unit: value.unit,
      }
    }),
  )
  await db
    .insert(sourceValues)
    .values(rows)
    .onConflictDoUpdate({
      target: [sourceValues.sourceVersionId, sourceValues.productGroupId, sourceValues.diet],
      set: {
        amountPerPersonDay: fromExcluded('menge_pro_person_tag'),
        unit: fromExcluded('mass_einheit'),
      },
    })
}

/** Braucht die Warengruppen (Schlüssel → id) aus dem Seed der Stammdaten. */
export async function seedRecommendationSource(
  db: Database,
  groupIds: Map<string, string>,
): Promise<void> {
  const versionId = await upsertVersion(db)
  await upsertNeeds(db, versionId)
  await upsertValues(db, versionId, groupIds)
  await db
    .update(households)
    .set({ activeSourceVersionId: versionId })
    .where(isNull(households.activeSourceVersionId))
}
