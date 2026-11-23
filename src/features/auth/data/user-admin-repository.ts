// Nutzer eines Haushalts für die Nutzerverwaltung (EIN-10, #41, #123). Jede Abfrage filtert auf
// haushalt_id. Hashes, E-Mail und Sitzungs-Token liest hier nichts. Änderungen an Rolle, Status
// und Verknüpfung laufen in einer Transaktion mit Sperre auf allen Nutzern des Haushalts, damit
// die Regel „letzter aktiver Admin“ auch bei zwei gleichzeitigen Aktionen hält (§3.3).
import 'server-only'
import { and, asc, eq, sql } from 'drizzle-orm'
import type { Database } from '@/server/db/connection'
import { accounts, sessions, users } from '@/server/db/schema/account'
import { households, members } from '@/server/db/schema/household'
import type { USER_ROLES } from '@/shared/config/constants'
import { CREDENTIAL_PROVIDER } from './credential'

export type UserRole = (typeof USER_ROLES)[number]

export type HouseholdUser = Readonly<{
  id: string
  name: string
  username: string
  role: UserRole
  isActive: boolean
  lastSignInAt: Date | null
  memberId: string | null
  memberName: string | null
  isPasswordTemporary: boolean
  passwordChangedAt: Date | null
}>

/** Was die Regeln der Nutzerverwaltung über jeden Nutzer wissen müssen */
export type ManagedUser = Readonly<{
  id: string
  role: UserRole
  isActive: boolean
  memberId: string | null
}>

type UserChange = Partial<Pick<ManagedUser, 'role' | 'isActive' | 'memberId'>>

export interface UserAdminTransaction {
  /** Alle Nutzer des Haushalts, gesperrt bis zum Ende der Transaktion */
  lockUsers: () => Promise<ManagedUser[]>
  update: (userId: string, change: UserChange) => Promise<void>
  endSessions: (userId: string) => Promise<void>
}

type NewUser = Readonly<{
  householdId: string
  name: string
  username: string
  role: UserRole
  memberId: string | null
  passwordHash: string
  createdBy: string
  now: Date
}>

export interface UserAdminRepository {
  list: (householdId: string) => Promise<HouseholdUser[]>
  find: (householdId: string, userId: string) => Promise<HouseholdUser | null>
  inTransaction: <T>(
    householdId: string,
    work: (tx: UserAdminTransaction) => Promise<T>,
  ) => Promise<T>
  isMemberInHousehold: (householdId: string, memberId: string) => Promise<boolean>
  readHouseholdName: (householdId: string) => Promise<string>
  /** null, wenn der Benutzername schon vergeben ist (auch an einen deaktivierten Nutzer) */
  create: (user: NewUser) => Promise<string | null>
}

const USER_COLUMNS = {
  id: users.id,
  name: users.name,
  username: users.username,
  role: users.role,
  isActive: users.isActive,
  lastSignInAt: users.lastSignInAt,
  memberId: users.memberId,
  memberName: members.name,
  isPasswordTemporary: users.isPasswordTemporary,
  passwordChangedAt: users.passwordChangedAt,
}

function selectUsers(db: Database, householdId: string, userId?: string) {
  const inHousehold = eq(users.householdId, householdId)
  return db
    .select(USER_COLUMNS)
    .from(users)
    .leftJoin(members, eq(members.id, users.memberId))
    .where(userId === undefined ? inHousehold : and(inHousehold, eq(users.id, userId)))
    .orderBy(asc(users.name), asc(users.username))
}

function transactionFor(tx: Database, householdId: string): UserAdminTransaction {
  const inHousehold = (userId: string) =>
    and(eq(users.householdId, householdId), eq(users.id, userId))
  return {
    lockUsers: () =>
      tx
        .select({
          id: users.id,
          role: users.role,
          isActive: users.isActive,
          memberId: users.memberId,
        })
        .from(users)
        .where(eq(users.householdId, householdId))
        .orderBy(asc(users.id))
        .for('update'),
    async update(userId, change) {
      await tx.update(users).set(change).where(inHousehold(userId))
    },
    async endSessions(userId) {
      await tx.delete(sessions).where(eq(sessions.userId, userId))
    },
  }
}

async function isUsernameTaken(tx: Database, username: string): Promise<boolean> {
  const [row] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(sql`lower(${users.username})`, username.toLowerCase()))
  return row !== undefined
}

async function insertUser(db: Database, user: NewUser): Promise<string | null> {
  return db.transaction(async (tx) => {
    // Sperrt Einfügungen, damit zwei gleichzeitige Aufrufe denselben Namen nicht beide anlegen.
    await tx.execute(sql`lock table ${users} in share row exclusive mode`)
    if (await isUsernameTaken(tx, user.username)) return null
    // Eine Person gehört höchstens zu einem Nutzer: Eine alte Verknüpfung löst sich.
    if (user.memberId !== null) {
      await tx
        .update(users)
        .set({ memberId: null })
        .where(and(eq(users.householdId, user.householdId), eq(users.memberId, user.memberId)))
    }
    const id = crypto.randomUUID()
    await tx.insert(users).values({
      id,
      name: user.name,
      username: user.username,
      email: `${id}@nutzer.invalid`,
      role: user.role,
      householdId: user.householdId,
      memberId: user.memberId,
      isPasswordTemporary: true,
      passwordChangedAt: user.now,
      passwordChangedBy: user.createdBy,
    })
    await tx.insert(accounts).values({
      accountId: id,
      providerId: CREDENTIAL_PROVIDER,
      userId: id,
      password: user.passwordHash,
    })
    return id
  })
}

export function createUserAdminRepository(db: Database): UserAdminRepository {
  return {
    list: (householdId) => selectUsers(db, householdId),
    async find(householdId, userId) {
      const [user] = await selectUsers(db, householdId, userId)
      return user ?? null
    },
    inTransaction: (householdId, work) =>
      db.transaction((tx) => work(transactionFor(tx, householdId))),
    async isMemberInHousehold(householdId, memberId) {
      const [row] = await db
        .select({ id: members.id })
        .from(members)
        .where(and(eq(members.householdId, householdId), eq(members.id, memberId)))
      return row !== undefined
    },
    async readHouseholdName(householdId) {
      const [row] = await db
        .select({ name: households.name })
        .from(households)
        .where(eq(households.id, householdId))
      return row?.name ?? ''
    },
    create: (user) => insertUser(db, user),
  }
}
