// Export eines Haushalts als JSON (#80, SYS-01), nur für Admins. Alle Teile kommen aus
// Repositories, die auf den Haushalt filtern. Was bewusst fehlt, steht in domain/household-export.ts.
import 'server-only'
import type { Database } from '@/server/db/connection'
import { getDb } from '@/server/db/get-db'
import { APP_LICENSE, APP_VERSION } from '@/shared/config/app-info'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  readExportHousehold,
  readExportMembers,
  readExportSource,
  readExportUsers,
} from '../data/household-export-repository'
import { readExportProducts, readExportRestock } from '../data/stock-export-repository'
import {
  buildHouseholdExport,
  exportFileName,
  type HouseholdExport,
} from '../domain/household-export'

export type ExportFile = Readonly<{ fileName: string; content: HouseholdExport }>

/** @internal Mit übergebener DB und Uhr, damit der Integrationstest sie setzen kann. */
export async function exportHousehold(
  db: Database,
  householdId: string,
  now: Date,
): Promise<Result<ExportFile, { kind: 'not-found' }>> {
  const household = await readExportHousehold(db, householdId)
  if (household === null) return err({ kind: 'not-found' })
  const [source, members, users, products, restock] = await Promise.all([
    readExportSource(db, householdId),
    readExportMembers(db, householdId),
    readExportUsers(db, householdId),
    readExportProducts(db, householdId),
    readExportRestock(db, householdId),
  ])
  const content = buildHouseholdExport(
    { household, source, members, users, products, restock },
    { appVersion: APP_VERSION, license: APP_LICENSE, exportedAt: now },
  )
  return ok({ fileName: exportFileName(now), content })
}

/** Für die Route: eigene DB-Verbindung und die aktuelle Uhrzeit. */
export async function exportHouseholdNow(
  householdId: string,
): Promise<Result<ExportFile, { kind: 'not-found' }>> {
  return exportHousehold(await getDb(), householdId, new Date())
}
