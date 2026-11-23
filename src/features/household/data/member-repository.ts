// Mitglieder eines Haushalts mit ihren Allergien (HH-01 bis HH-04). Jede Abfrage filtert auf
// haushalt_id, eine fremde ID findet also nichts (CODE_PRINZIPIEN §8). Allergien hängen am Mitglied
// und werden beim Speichern als Ganzes ersetzt.
import 'server-only'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { Member, MemberValues } from '@/features/household/domain/member'
import type { Database } from '@/server/db/connection'
import { memberAllergies, members } from '@/server/db/schema/household'
import { toCalendarDay } from '@/shared/lib/dates'

export interface MemberRepository {
  list: (householdId: string) => Promise<Member[]>
  find: (householdId: string, memberId: string) => Promise<Member | null>
  create: (householdId: string, values: MemberValues) => Promise<string>
  /** false, wenn es die Person in diesem Haushalt nicht gibt */
  update: (householdId: string, memberId: string, values: MemberValues) => Promise<boolean>
  remove: (householdId: string, memberId: string) => Promise<boolean>
}

const MEMBER_COLUMNS = {
  id: members.id,
  name: members.name,
  type: members.type,
  birthDate: members.birthDate,
  sex: members.sex,
  activityLevel: members.activityLevel,
  weightKg: members.weightKg,
  condition: members.condition,
  diet: members.diet,
}

type MemberRow = Awaited<ReturnType<typeof selectMembers>>[number]

function selectMembers(db: Database, householdId: string, memberId?: string) {
  const inHousehold = eq(members.householdId, householdId)
  return db
    .select(MEMBER_COLUMNS)
    .from(members)
    .where(memberId === undefined ? inHousehold : and(inHousehold, eq(members.id, memberId)))
    .orderBy(asc(members.createdAt), asc(members.name))
}

async function loadAllergies(db: Database, memberIds: string[]): Promise<Map<string, string[]>> {
  const byMember = new Map<string, string[]>()
  if (memberIds.length === 0) return byMember
  const rows = await db
    .select({ memberId: memberAllergies.memberId, label: memberAllergies.label })
    .from(memberAllergies)
    .where(inArray(memberAllergies.memberId, memberIds))
    .orderBy(asc(memberAllergies.label))
  for (const row of rows)
    byMember.set(row.memberId, [...(byMember.get(row.memberId) ?? []), row.label])
  return byMember
}

function toMember(row: MemberRow, allergies: readonly string[]): Member {
  return {
    ...row,
    birthDate: row.birthDate === null ? null : toCalendarDay(row.birthDate),
    weightKg: row.weightKg === null ? null : Number(row.weightKg),
    allergies,
  }
}

async function listMembers(db: Database, householdId: string, memberId?: string) {
  const rows = await selectMembers(db, householdId, memberId)
  const allergies = await loadAllergies(
    db,
    rows.map((row) => row.id),
  )
  return rows.map((row) => toMember(row, allergies.get(row.id) ?? []))
}

function toColumns(values: MemberValues) {
  const { name, type, birthDate, sex, activityLevel, weightKg, condition, diet } = values
  const weight = weightKg === null ? null : String(weightKg)
  return { name, type, birthDate, sex, activityLevel, weightKg: weight, condition, diet }
}

async function replaceAllergies(tx: Database, memberId: string, labels: readonly string[]) {
  await tx.delete(memberAllergies).where(eq(memberAllergies.memberId, memberId))
  if (labels.length === 0) return
  await tx.insert(memberAllergies).values(labels.map((label) => ({ memberId, label })))
}

type MemberUpdate = Readonly<{ householdId: string; id: string; values: MemberValues }>

async function updateMember(db: Database, { householdId, id, values }: MemberUpdate) {
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(members)
      .set(toColumns(values))
      .where(and(eq(members.householdId, householdId), eq(members.id, id)))
      .returning({ id: members.id })
    if (updated.length === 0) return false
    await replaceAllergies(tx, id, values.allergies)
    return true
  })
}

export function createMemberRepository(db: Database): MemberRepository {
  return {
    list: (householdId) => listMembers(db, householdId),
    async find(householdId, memberId) {
      const [member] = await listMembers(db, householdId, memberId)
      return member ?? null
    },
    create: (householdId, values) =>
      db.transaction(async (tx) => {
        const id = crypto.randomUUID()
        await tx.insert(members).values({ ...toColumns(values), id, householdId })
        await replaceAllergies(tx, id, values.allergies)
        return id
      }),
    update: (householdId, memberId, values) =>
      updateMember(db, { householdId, id: memberId, values }),
    async remove(householdId, memberId) {
      const removed = await db
        .delete(members)
        .where(and(eq(members.householdId, householdId), eq(members.id, memberId)))
        .returning({ id: members.id })
      return removed.length > 0
    },
  }
}
