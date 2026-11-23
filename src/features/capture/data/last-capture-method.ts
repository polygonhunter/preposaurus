// Weg der letzten Erfassung des Nutzers (DATENKATALOG §2.9): Der Erfassen-Knopf öffnet ihn wieder.
import 'server-only'
import { and, desc, eq } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { captures } from '@/server/db/schema/confirmed-captures'
import type { CaptureMethod } from '../domain/stock-draft'
import type { DraftOwner } from './draft-repository'

export async function findLastCaptureMethod(
  db: Database,
  owner: DraftOwner,
): Promise<CaptureMethod | null> {
  const [row] = await db
    .select({ method: captures.method })
    .from(captures)
    .where(and(eq(captures.householdId, owner.householdId), eq(captures.userId, owner.userId)))
    .orderBy(desc(captures.createdAt))
    .limit(1)
  if (row === undefined) return null
  return row.method === 'foto' ? 'photo' : 'manual'
}
