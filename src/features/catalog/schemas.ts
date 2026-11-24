// Schemas der Stammdaten-Seiten (EIN-04): Namen, IDs, die Richtung beim Sortieren, eigene Kategorien
// und Lebensmittelarten. Sie lesen die Textfelder der Formulare, der Haushalt kommt nie aus der
// Eingabe, sondern aus der Sitzung.
import { z } from 'zod'

const NAME_MAX_LENGTH = 40
const SEARCH_TERM_MAX_LENGTH = 40
const MAX_SEARCH_TERMS = 20
const MAX_KCAL_PER_100 = 900
/** Mehr als 100 g Eiweiß, Kohlenhydrate oder Fett passen nicht in 100 g. */
const MAX_MACRO_PER_100 = 100
/** 30 Jahre, wie die Grenze der KI-Schätzung (`haltbar_monate`) */
const MAX_SHELF_LIFE_MONTHS = 360

export const catalogNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'Bitte einen Namen eintragen.' })
  .max(NAME_MAX_LENGTH, { error: 'Bitte höchstens 40 Zeichen.' })

export const catalogIdSchema = z.uuid()

export const moveDirectionSchema = z.enum(['up', 'down'])

const emptyToNull = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? null : value

/** „Knusperflocken, Pops“ → ['Knusperflocken', 'Pops'], doppelte (ohne Groß/klein) nur einmal */
function splitSearchTerms(text: string): string[] {
  const seen = new Set<string>()
  return text
    .split(/[,;\n]/)
    .map((term) => term.trim())
    .filter((term) => {
      const key = term.toLocaleLowerCase('de')
      if (term === '' || seen.has(key)) return false
      seen.add(key)
      return true
    })
}

type NumberBounds = Readonly<{ min: number; max: number; message: string; isWhole?: boolean }>

/** Freiwillige Zahl aus einem Textfeld: leer heißt null, Komma oder Punkt als Dezimalzeichen. */
function optionalNumberText({ min, max, message, isWhole = false }: NumberBounds) {
  const error = { error: message }
  const bounded = z.number(error).min(min, error).max(max, error)
  return z.preprocess(
    emptyToNull,
    z
      .string()
      .transform((text) => Number(text.trim().replace(',', '.')))
      .pipe(isWhole ? bounded.int(error) : bounded)
      .nullable(),
  )
}

const macroPer100Text = optionalNumberText({
  min: 0,
  max: MAX_MACRO_PER_100,
  message: 'Bitte die Gramm als Zahl von 0 bis 100 eintragen.',
})

/** Richtwerte einer eigenen Art (#126, #243), dieselben Felder wie bei System-Arten. */
const foodTypeReferenceFields = {
  kcalPer100: optionalNumberText({
    min: 0,
    max: MAX_KCAL_PER_100,
    message: 'Bitte die kcal als Zahl von 0 bis 900 eintragen.',
  }),
  proteinPer100: macroPer100Text,
  carbsPer100: macroPer100Text,
  fatPer100: macroPer100Text,
  typicalShelfLifeMonths: optionalNumberText({
    min: 1,
    max: MAX_SHELF_LIFE_MONTHS,
    message: 'Bitte die Monate als ganze Zahl von 1 bis 360 eintragen.',
    isWhole: true,
  }),
}

/** Eigene Kategorie (#76): Name und Warengruppe, die bestimmt, in welche Rechnung sie zählt. */
export const categoryFormSchema = z.object({
  name: catalogNameSchema,
  productGroupId: z.uuid({ error: 'Bitte eine Warengruppe wählen.' }),
})

export type CategoryInput = z.infer<typeof categoryFormSchema>

/** Eigene Lebensmittelart (#126, #243): Name, Kategorie, freiwillig Suchwörter und Richtwerte. */
export const foodTypeFormSchema = z.object({
  name: catalogNameSchema,
  categoryId: z.uuid({ error: 'Bitte eine Kategorie wählen.' }),
  searchTerms: z
    .string()
    .transform(splitSearchTerms)
    .pipe(
      z
        .array(
          z
            .string()
            .max(SEARCH_TERM_MAX_LENGTH, { error: 'Bitte je Suchwort höchstens 40 Zeichen.' }),
        )
        .max(MAX_SEARCH_TERMS, { error: 'Bitte höchstens 20 Suchwörter.' }),
    ),
  ...foodTypeReferenceFields,
})

export type FoodTypeInput = z.infer<typeof foodTypeFormSchema>
