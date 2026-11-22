// Ersteinrichtung (#34, ONBOARDING §2.3): erster Admin, Haushalt, Einstellungen und Ziel in einer
// Transaktion. Die Tabellensperre auf nutzer hält einen zweiten, gleichzeitigen Aufruf an, bis der
// erste fertig ist. Danach sieht er den neuen Nutzer und legt nichts an. SHARE ROW EXCLUSIVE sperrt
// sich selbst und jedes INSERT, also auch Wege am Use-Case vorbei.
// Der Nutzer entsteht am Username-Plugin vorbei, weil Better Auth keine fremde Transaktion kennt.
// Spalten und technische E-Mail wie bei Better Auth (05_STATUS „Konto“), der Hash kommt fertig.
import 'server-only'
import { sql } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { accounts, users } from '@/server/db/schema/account'
import { householdSettings, households } from '@/server/db/schema/household'
import { goals } from '@/server/db/schema/recommendation'
import { CREDENTIAL_PROVIDER } from './credential'

// Schritt 1 der Einrichtung ist mit dem Konto erledigt, die übrigen folgen mit #40.
const ACCOUNT_STEP = 1

type NewFirstAdmin = Readonly<{
  displayName: string
  username: string
  passwordHash: string
  householdName: string
  goalDays: number
}>

export interface FirstAdminRepository {
  hasAnyUser: () => Promise<boolean>
  /** false, wenn es schon einen Nutzer gibt (dann ist nichts angelegt) */
  createFirstAdmin: (admin: NewFirstAdmin) => Promise<boolean>
}

async function hasAnyUser(db: Database): Promise<boolean> {
  const [row] = await db.select({ id: users.id }).from(users).limit(1)
  return row !== undefined
}

async function insertHousehold(tx: Database, admin: NewFirstAdmin): Promise<string> {
  const [household] = await tx
    .insert(households)
    .values({ name: admin.householdName })
    .returning({ id: households.id })
  if (household === undefined) throw new Error('Haushalt wurde nicht angelegt')
  await tx.insert(householdSettings).values({ householdId: household.id, setupStep: ACCOUNT_STEP })
  await tx.insert(goals).values({ householdId: household.id, days: admin.goalDays })
  return household.id
}

async function insertAdmin(tx: Database, admin: NewFirstAdmin, householdId: string) {
  const id = crypto.randomUUID()
  await tx.insert(users).values({
    id,
    name: admin.displayName,
    username: admin.username,
    email: `${id}@nutzer.invalid`,
    role: 'admin',
    householdId,
  })
  await tx.insert(accounts).values({
    accountId: id,
    providerId: CREDENTIAL_PROVIDER,
    userId: id,
    password: admin.passwordHash,
  })
}

export function createFirstAdminRepository(db: Database): FirstAdminRepository {
  return {
    hasAnyUser: () => hasAnyUser(db),
    createFirstAdmin: (admin) =>
      db.transaction(async (tx) => {
        await tx.execute(sql`lock table ${users} in share row exclusive mode`)
        if (await hasAnyUser(tx)) return false
        await insertAdmin(tx, admin, await insertHousehold(tx, admin))
        return true
      }),
  }
}
