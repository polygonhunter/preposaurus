// Schemas der Stammdaten-Seiten (EIN-04): Namen, IDs, die Richtung beim Sortieren, eigene Kategorien
// und Lebensmittelarten. Sie lesen die Textfelder der Formulare, der Haushalt kommt nie aus der
// Eingabe, sondern aus der Sitzung.
import { z } from 'zod'

const NAME_MAX_LENGTH = 40
const SEARCH_TERM_MAX_LENGTH = 40
const MAX_SEARCH_TERMS = 20
const MAX_KCAL_PER_100 = 900

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

const kcalMessage = { error: 'Bitte die kcal als Zahl von 0 bis 900 eintragen.' }

/** Eigene Kategorie (#76): Name und Warengruppe, die bestimmt, in welche Rechnung sie zählt. */
export const categoryFormSchema = z.object({
  name: catalogNameSchema,
  productGroupId: z.uuid({ error: 'Bitte eine Warengruppe wählen.' }),
})

export type CategoryInput = z.infer<typeof categoryFormSchema>

/** Eigene Lebensmittelart (#126): Name, Kategorie, freiwillig Suchwörter und ein kcal-Richtwert. */
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
  kcalPer100: z.preprocess(
    emptyToNull,
    z
      .string()
      .transform((text) => Number(text.trim().replace(',', '.')))
      .pipe(z.number(kcalMessage).min(0, kcalMessage).max(MAX_KCAL_PER_100, kcalMessage))
      .nullable(),
  ),
})

export type FoodTypeInput = z.infer<typeof foodTypeFormSchema>
