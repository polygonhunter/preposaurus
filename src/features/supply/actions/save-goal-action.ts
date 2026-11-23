'use server'
// Ziel speichern (#39), nur der Admin. Ein Zieldatum in der Vergangenheit wird nicht gespeichert,
// stattdessen steht am Feld eine freundliche Bitte um ein neues.
import { refresh } from 'next/cache'
import { z } from 'zod'
import { requireHouseholdAdmin, type AccessError } from '@/server/auth/guards'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { goalServices } from '../application/goal-services'
import { saveGoal } from '../application/goal-settings'
import { goalSchema } from '../schemas'

type GoalField = 'choice' | 'customDays' | 'targetDate'

type GoalTexts = Readonly<Record<GoalField, string>>

export type GoalFormState = Readonly<{
  status: 'idle' | 'saved' | 'error'
  errors: Partial<Record<GoalField, string>>
  message: string | null
  values: GoalTexts | null
}>

const PAST_DATE = 'Dieses Datum ist schon vorbei. Magst du ein neues wählen?'

function accessMessage(error: AccessError): string {
  return error.kind === 'unauthenticated' ? 'Bitte melde dich erneut an.' : 'Das ändert ein Admin.'
}

function readForm(formData: FormData): GoalTexts {
  return {
    choice: readFormText(formData, 'dauer'),
    customDays: readFormText(formData, 'eigene-tage'),
    targetDate: readFormText(formData, 'zieldatum'),
  }
}

const failed = (values: GoalTexts, errors: GoalFormState['errors'], message: string | null) =>
  ({ status: 'error', errors, message, values }) as const

export async function saveGoalAction(
  _previous: GoalFormState,
  formData: FormData,
): Promise<GoalFormState> {
  const values = readForm(formData)
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return failed(values, {}, accessMessage(admin.error))
  const parsed = goalSchema.safeParse(values)
  if (!parsed.success) {
    return failed(values, firstMessages(z.flattenError(parsed.error).fieldErrors), null)
  }
  const result = await saveGoal(await goalServices(), {
    householdId: admin.value.householdId,
    input: parsed.data,
  })
  if (!result.ok) return failed(values, { targetDate: PAST_DATE }, null)
  refresh()
  return { status: 'saved', errors: {}, message: 'Gespeichert.', values: null }
}
