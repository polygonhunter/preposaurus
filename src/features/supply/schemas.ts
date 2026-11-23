// Schema des Ziels (ZIEL-03, ZIEL-04). Das Formular schickt die gewählte Dauer („3“, „10“, „14“ oder
// „eigen“), bei „eigen“ den eigenen Wert und ein freiwilliges Datum (JJJJ-MM-TT aus dem Datumsfeld).
import { z } from 'zod'
import { GOAL_DAY_PRESETS, MAX_GOAL_DAYS } from '@/shared/config/constants'
import { parseCalendarDay } from '@/shared/lib/dates'

export const CUSTOM_GOAL_CHOICE = 'eigen'

const DAYS_MESSAGE = `Bitte eine Zahl von 1 bis ${String(MAX_GOAL_DAYS)} eintragen.`
const PRESET_CHOICES = GOAL_DAY_PRESETS.map(String)

const customDaysSchema = z.coerce
  .number({ error: DAYS_MESSAGE })
  .int({ error: DAYS_MESSAGE })
  .min(1, { error: DAYS_MESSAGE })
  .max(MAX_GOAL_DAYS, { error: DAYS_MESSAGE })

const targetDateSchema = z
  .string()
  .trim()
  .transform((text, context) => {
    if (text === '') return null
    const day = parseCalendarDay(text)
    if (day === null)
      context.addIssue({ code: 'custom', message: 'Bitte ein gültiges Datum wählen.' })
    return day
  })

const choiceSchema = z
  .string()
  .refine((choice) => choice === CUSTOM_GOAL_CHOICE || PRESET_CHOICES.includes(choice), {
    error: 'Bitte eine Dauer wählen.',
  })

export const goalSchema = z
  .object({ choice: choiceSchema, customDays: z.string(), targetDate: targetDateSchema })
  .transform((form, context) => {
    if (form.choice !== CUSTOM_GOAL_CHOICE) {
      return { days: Number(form.choice), targetDate: form.targetDate }
    }
    const custom = customDaysSchema.safeParse(form.customDays)
    if (custom.success) return { days: custom.data, targetDate: form.targetDate }
    context.addIssue({ code: 'custom', path: ['customDays'], message: DAYS_MESSAGE })
    return z.NEVER
  })

export type GoalInput = z.infer<typeof goalSchema>
