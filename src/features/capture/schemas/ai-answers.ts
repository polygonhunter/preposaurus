// KI-Schemas der Foto-Erkennung (technik.html#api-ki). Einzige Quelle für Structured Output und
// für die Prüfung der Antwort. Bewusst schlank: alle Felder Pflicht und nullable, keine Zahlen-
// oder Längengrenzen, weil Anthropic sie nicht unterstützt. Die Grenzen prüft danach das Mapping
// in capture/domain (map-recognition.ts, map-best-before-recognition.ts).
import { z } from 'zod'
import { AI_CONFIDENCE_LEVELS, CONTAINER_KEYS } from '@/shared/config/constants'

const confidence = z.enum(AI_CONFIDENCE_LEVELS).describe('Wie sicher die Werte lesbar waren')

const nullableNumber = (description: string) => z.number().nullable().describe(description)

/**
 * Lebensmittelart nur aus der erlaubten Liste des Haushalts, sonst null (#110). Die Liste
 * entsteht bei jedem Aufruf aus den Stammdaten. Ohne Einträge bleibt nur null.
 */
function foodTypeField(allowedKeys: readonly string[]) {
  const [first, ...rest] = allowedKeys
  const description = 'Schlüssel der Lebensmittelart aus der Liste, null wenn keiner sicher passt'
  if (first === undefined) return z.null().describe(description)
  return z
    .enum([first, ...rest])
    .nullable()
    .describe(description)
}

/**
 * Vorschlag einer neuen Lebensmittelart (#142), nur wenn keine Art der Liste passt. Die Kategorie
 * stammt aus den sichtbaren Kategorien des Haushalts (Name, nicht ID: Die KI soll ihn lesen
 * können). Ohne Kategorien bleibt nur null. Angelegt wird nie automatisch.
 */
function newFoodTypeField(allowedCategoryNames: readonly string[]) {
  const [first, ...rest] = allowedCategoryNames
  const description =
    'Nur wenn lebensmittelart null ist und das Lebensmittel sicher erkennbar ist: neue Art, sonst null'
  if (first === undefined) return z.null().describe(description)
  return z
    .strictObject({
      name: z
        .string()
        .describe(
          'Kurzer generischer deutscher Name ohne Marke, Sorte oder Menge, z. B. „Dinkelreis“',
        ),
      kategorie: z.enum([first, ...rest]).describe('Passende Kategorie aus der Liste'),
    })
    .nullable()
    .describe(description)
}

/** Was Schema A zur Laufzeit aus dem Haushalt bekommt: sichtbare Arten und Kategorien. */
export interface PackagingSchemaChoices {
  foodTypeKeys: readonly string[]
  categoryNames: readonly string[]
}

/** Schema A · Verpackung. Die Listen kommen zur Laufzeit aus dem Haushalt. */
export function packagingAnswerSchema({ foodTypeKeys, categoryNames }: PackagingSchemaChoices) {
  return z.strictObject({
    bezeichnung: z
      .string()
      .nullable()
      .describe('Generische deutsche Bezeichnung ohne Marke, z. B. „Spaghetti“'),
    lebensmittelart: foodTypeField(foodTypeKeys),
    neue_lebensmittelart_vorschlag: newFoodTypeField(categoryNames),
    behaelter: z
      .enum(CONTAINER_KEYS)
      .nullable()
      .describe('Art der Verpackung, null wenn keine davon passt'),
    inhalt: z.strictObject({
      wert: nullableNumber('Füllmenge laut Aufdruck'),
      einheit: z.enum(['g', 'ml']).nullable().describe('Einheit der Füllmenge'),
    }),
    abtropfgewicht_g: nullableNumber('Abtropfgewicht in Gramm, falls aufgedruckt'),
    sicherheit: confidence,
  })
}

const macroFields = {
  kcal: nullableNumber('Brennwert in kcal'),
  eiweiss_g: nullableNumber('Eiweiß in Gramm'),
  kohlenhydrate_g: nullableNumber('Kohlenhydrate in Gramm'),
  fett_g: nullableNumber('Fett in Gramm'),
}

/** Schema B · Nährwerttabelle, Werte wie aufgedruckt. kJ nur, damit die App umrechnen kann. */
export const nutritionAnswerSchema = z.strictObject({
  bezug: z.enum(['100g', '100ml', 'portion']).describe('Worauf sich die Werte beziehen'),
  portionsgroesse: nullableNumber('Portionsgröße in g bzw. ml, nur bei Bezug „portion“'),
  ...macroFields,
  kj: nullableNumber('Brennwert in kJ'),
  sicherheit: confidence,
})

/** Schätzung ohne Nährwerttabelle (#124), je 100 g bzw. 100 ml. Nur auf ausdrückliche Wahl. */
export const nutritionEstimateAnswerSchema = z.strictObject({
  ...macroFields,
  sicherheit: confidence,
})

/** Schema C · MHD, auch für den Zweitversuch. */
export const bestBeforeAnswerSchema = z.strictObject({
  roh_text: z.string().nullable().describe('Datumsaufdruck genau wie gelesen'),
  datum: z
    .string()
    .nullable()
    .describe('Datum als JJJJ-MM-TT, null wenn nicht sicher lesbar. Niemals erfinden'),
  genauigkeit: z
    .enum(['tag', 'monat', 'jahr', 'unbekannt'])
    .describe('Was aufgedruckt ist: Tag, nur Monat oder nur Jahr'),
  art: z
    .enum(['mhd', 'verbrauchen_bis', 'unbekannt'])
    .describe('Mindesthaltbarkeitsdatum oder „zu verbrauchen bis“'),
  sicherheit: confidence,
})

/**
 * MHD-Schätzung bei „Datum fehlt“ (#124), nur auf ausdrückliche Wahl. Die KI nennt nie ein Datum,
 * nur eine Haltbarkeit ab heute. Das Datum rechnet die App, immer auf das Monatsende (#170).
 */
export const bestBeforeEstimateAnswerSchema = z.strictObject({
  haltbar_monate: nullableNumber(
    'Geschätzte Haltbarkeit ab heute in ganzen Monaten, null wenn nicht sinnvoll schätzbar',
  ),
  sicherheit: confidence,
})

export type PackagingAnswer = z.infer<ReturnType<typeof packagingAnswerSchema>>
export type NutritionAnswer = z.infer<typeof nutritionAnswerSchema>
export type NutritionEstimateAnswer = z.infer<typeof nutritionEstimateAnswerSchema>
export type BestBeforeAnswer = z.infer<typeof bestBeforeAnswerSchema>
export type BestBeforeEstimateAnswer = z.infer<typeof bestBeforeEstimateAnswerSchema>
