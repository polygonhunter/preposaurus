// Schemas des Haushalts (HH-01 bis HH-04, ROT-05). Sie lesen die Textfelder der Formulare: Leere
// Felder werden zu null, Zahlen dürfen ein Komma haben. Ob das Geburtsjahr in der Zukunft liegt,
// prüft domain/birth.ts mit dem heutigen Tag, weil ein Schema keine Uhr kennt.
import { z } from 'zod'
import {
  ACTIVITY_LEVELS,
  DIETS,
  MEMBER_CONDITIONS,
  MEMBER_TYPES,
  SEXES,
} from '@/shared/config/constants'

const NAME_MAX_LENGTH = 60
const MIN_BIRTH_YEAR = 1900
const MAX_BIRTH_YEAR = 2100
const MAX_WEIGHT_KG = 500
const ALLERGY_MAX_LENGTH = 40
const MAX_ALLERGIES = 10

const emptyToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

const optional = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToNull, schema.nullable())

const optionalChoice = <const T extends readonly [string, ...string[]]>(values: T) =>
  optional(z.enum(values))

const wholeNumber = (min: number, max: number, message: string) =>
  z.coerce.number({ error: message }).int({ error: message }).min(min, message).max(max, message)

const decimalText = z
  .string()
  .trim()
  .transform((text) => Number(text.replace(',', '.')))

function splitAllergies(text: string): string[] {
  const labels = text
    .split(/[,;\n]/)
    .map((label) => label.trim())
    .filter((label) => label !== '')
  const seen = new Set<string>()
  return labels.filter((label) => {
    const key = label.toLocaleLowerCase('de')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const allergiesSchema = z
  .string()
  .transform(splitAllergies)
  .pipe(
    z
      .array(
        z.string().max(ALLERGY_MAX_LENGTH, { error: 'Bitte je Eintrag höchstens 40 Zeichen.' }),
      )
      .max(MAX_ALLERGIES, { error: 'Bitte höchstens 10 Einträge.' }),
  )

export const memberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Bitte einen Namen eintragen.' })
    .max(NAME_MAX_LENGTH, { error: 'Bitte höchstens 60 Zeichen.' }),
  type: z.enum(MEMBER_TYPES, { error: 'Bitte wähle, wer das ist.' }),
  birthYear: wholeNumber(MIN_BIRTH_YEAR, MAX_BIRTH_YEAR, 'Bitte ein Jahr wie 1988 eintragen.'),
  birthMonth: optional(wholeNumber(1, 12, 'Bitte einen Monat von 1 bis 12 eintragen.')),
  sex: optionalChoice(SEXES),
  activityLevel: optionalChoice(ACTIVITY_LEVELS),
  weightKg: optional(
    decimalText.pipe(
      z
        .number({ error: 'Bitte das Gewicht in kg als Zahl eintragen.' })
        .positive({ error: 'Bitte das Gewicht in kg als Zahl eintragen.' })
        .max(MAX_WEIGHT_KG, { error: 'Bitte das Gewicht in kg als Zahl eintragen.' }),
    ),
  ),
  condition: optionalChoice(MEMBER_CONDITIONS),
  diet: optionalChoice(DIETS),
  allergies: allergiesSchema,
})

export type MemberInput = z.infer<typeof memberSchema>

export const memberIdSchema = z.uuid()

/** Ziel nach dem Speichern einer Person: Mitgliederliste oder Schritt der Einrichtung (#40) */
export const memberReturnSchema = z.enum(['einstellungen', 'einrichtung'])

export type MemberReturn = z.infer<typeof memberReturnSchema>

export const householdDietSchema = z.enum(DIETS, { error: 'Bitte eine Ernährungsform wählen.' })

// Ampel-Schwellen (EIN-05, #78) als ganze Tage. Wie sie zueinander stehen (Orange mindestens
// 7 Tage und nie größer als Gelb), prüft die Fachlogik validateAmpelThresholds.
const MAX_AMPEL_DAYS = 365
const ampelDays = wholeNumber(1, MAX_AMPEL_DAYS, 'Bitte ganze Tage von 1 bis 365 eintragen.')

export const ampelThresholdsSchema = z.object({ soonDays: ampelDays, urgentDays: ampelDays })
