// KI-Schemas der Foto-Erkennung (technik.html#api-ki). Einzige Quelle für Structured Output und
// für die Prüfung der Antwort. Bewusst schlank: alle Felder Pflicht und nullable, keine Zahlen-
// oder Längengrenzen, weil Anthropic sie nicht unterstützt. Die Grenzen prüft danach das Mapping
// in capture/domain (map-recognition.ts, map-best-before-recognition.ts).
import { z } from 'zod'
import { CONTAINER_KEYS } from '@/shared/config/constants'

const confidence = z
  .enum(['hoch', 'mittel', 'niedrig'])
  .describe('Wie sicher die Werte lesbar waren')

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

/** Schema A · Verpackung. Die Liste der Lebensmittelarten kommt zur Laufzeit aus dem Haushalt. */
export function packagingAnswerSchema(allowedFoodTypeKeys: readonly string[]) {
  return z.strictObject({
    bezeichnung: z
      .string()
      .nullable()
      .describe('Generische deutsche Bezeichnung ohne Marke, z. B. „Spaghetti“'),
    lebensmittelart: foodTypeField(allowedFoodTypeKeys),
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

export type PackagingAnswer = z.infer<ReturnType<typeof packagingAnswerSchema>>
export type NutritionAnswer = z.infer<typeof nutritionAnswerSchema>
export type NutritionEstimateAnswer = z.infer<typeof nutritionEstimateAnswerSchema>
export type BestBeforeAnswer = z.infer<typeof bestBeforeAnswerSchema>
