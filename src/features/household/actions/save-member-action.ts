'use server'
// Mitglied anlegen oder ändern (#38). Nur der Admin, geprüft bei jedem Aufruf. Fehler stehen am
// Feld, die Eingaben behält das Formular selbst. Nach dem Speichern geht es zur Liste.
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { MEMBERS_PATH } from '@/shared/config/settings-paths'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { householdServices } from '../application/household-services'
import { saveMember, type SaveMemberError } from '../application/save-member'
import type { BirthProblem } from '../domain/birth'
import { memberIdSchema, memberSchema, type MemberInput } from '../schemas'
import { MEMBER_GONE, accessMessage } from './action-messages'

type MemberField = keyof MemberInput

type FormTexts = Readonly<Record<MemberField, string>>

export type MemberFormState = Readonly<{
  errors: Partial<Record<MemberField, string>>
  message: string | null
  // Was abgeschickt wurde, damit das Formular nach einem Fehler nichts verliert
  values: FormTexts | null
}>

const FORM_FIELDS: Record<MemberField, string> = {
  name: 'name',
  type: 'typ',
  birthYear: 'geburtsjahr',
  birthMonth: 'geburtsmonat',
  sex: 'geschlecht',
  activityLevel: 'aktivitaet',
  weightKg: 'gewicht',
  condition: 'zustand',
  diet: 'ernaehrungsform',
  allergies: 'allergien',
}

const BIRTH_ERRORS: Record<BirthProblem, Partial<Record<MemberField, string>>> = {
  'month-missing': { birthMonth: 'Bei Babys bitte auch den Monat eintragen.' },
  'in-future': { birthYear: 'Dieses Datum liegt noch in der Zukunft.' },
}

function readForm(formData: FormData): FormTexts {
  const entries = Object.entries(FORM_FIELDS).map(([field, name]) => [
    field,
    readFormText(formData, name),
  ])
  return Object.fromEntries(entries) as FormTexts
}

function readMemberId(formData: FormData): string | null | undefined {
  const raw = readFormText(formData, 'id')
  if (raw === '') return null
  const parsed = memberIdSchema.safeParse(raw)
  return parsed.success ? parsed.data : undefined
}

function errorState(error: SaveMemberError, values: FormTexts): MemberFormState {
  if (error.kind === 'not-found') return { errors: {}, message: MEMBER_GONE, values }
  return { errors: BIRTH_ERRORS[error.problem], message: null, values }
}

export async function saveMemberAction(
  _previous: MemberFormState,
  formData: FormData,
): Promise<MemberFormState> {
  const values = readForm(formData)
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return { errors: {}, message: accessMessage(admin.error), values }
  const memberId = readMemberId(formData)
  if (memberId === undefined) return { errors: {}, message: MEMBER_GONE, values }
  const parsed = memberSchema.safeParse(values)
  if (!parsed.success) {
    const errors = firstMessages(z.flattenError(parsed.error).fieldErrors)
    return { errors, message: null, values }
  }
  const result = await saveMember(await householdServices(), {
    householdId: admin.value.householdId,
    memberId,
    input: parsed.data,
  })
  if (!result.ok) return errorState(result.error, values)
  redirect(MEMBERS_PATH)
}
