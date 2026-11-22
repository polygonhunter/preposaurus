// KI-Schemas der Foto-Erkennung (technik.html#api-ki). Einzige Quelle für Structured Output und
// für die Prüfung der Antwort. Bewusst schlank: alle Felder Pflicht und nullable, keine Zahlen-
// oder Längengrenzen, weil Anthropic sie nicht unterstützt. Die Grenzen prüft danach das Mapping
// in capture/domain (map-recognition.ts, map-best-before-recognition.ts).
// Dazu am Ende die Eingabe des Speicherns (#51), gleich für Foto und manuell, und das manuelle
// Formular (#52), das auf dem Gerät in genau diese Eingabe übersetzt und mit ihr geprüft wird.
import { z } from 'zod'
import { AI_CONFIDENCE_LEVELS, CONTAINER_KEYS, PHOTO_ROLES } from '@/shared/config/constants'
import { parseCalendarDay } from '@/shared/lib/dates'
import {
  parseContentQuantity,
  parseGermanNumber,
  type ContentParseError,
} from '@/shared/lib/quantities'

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

/**
 * MHD-Schätzung bei „Datum fehlt“ (#124), nur auf ausdrückliche Wahl. Die KI nennt nie ein Datum,
 * nur eine Haltbarkeit ab heute. Das Datum rechnet die App (Monats- bzw. Jahresende).
 */
export const bestBeforeEstimateAnswerSchema = z.strictObject({
  haltbar_monate: nullableNumber(
    'Geschätzte Haltbarkeit ab heute in ganzen Monaten, null wenn nicht sinnvoll schätzbar',
  ),
  genauigkeit: z
    .enum(['monat', 'jahr'])
    .describe('Wie genau die Schätzung gemeint ist: auf den Monat oder nur auf das Jahr'),
  sicherheit: confidence,
})

/** Query von `POST /api/photos?rolle=…&entwurf=…`. Der Body ist das rohe Bild. */
export const photoUploadQuerySchema = z.object({
  rolle: z.enum(PHOTO_ROLES),
  entwurf: z.uuid().optional(),
})

/** `GET /api/photos/[id]?variante=vorschau`. Ohne Variante kommt das verkleinerte Bild. */
export const photoRequestSchema = z.object({
  id: z.uuid(),
  variante: z
    .enum(['bild', 'vorschau'])
    .default('bild')
    .transform((variant) => (variant === 'vorschau' ? 'thumbnail' : 'full')),
})

export type PackagingAnswer = z.infer<ReturnType<typeof packagingAnswerSchema>>
export type NutritionAnswer = z.infer<typeof nutritionAnswerSchema>
export type NutritionEstimateAnswer = z.infer<typeof nutritionEstimateAnswerSchema>
export type BestBeforeAnswer = z.infer<typeof bestBeforeAnswerSchema>
export type BestBeforeEstimateAnswer = z.infer<typeof bestBeforeEstimateAnswerSchema>

// ---------- Speichern einer Erfassung (#51) ----------
// Eingabe von createStockAction. Die Grenzen folgen den Spalten: Mengen numeric(9,2),
// Nährwerte je 100 numeric(6,2).

const MAX_CONTENT = 9_999_999
const MAX_PER_100 = 9_999
const MAX_NAME_LENGTH = 120
/** Schnellzahlen gehen bis 12, hochzählen darf weiter. Mehr in einem Chip ist ein Tippfehler. */
export const MAX_COUNT_PER_DATE = 99
const MAX_DATES_PER_CAPTURE = 30

const calendarDay = z.string().transform((text, context) => {
  const day = parseCalendarDay(text)
  if (day !== null) return day
  context.addIssue({ code: 'custom', message: 'Kein gültiges Datum' })
  return z.NEVER
})

const unitEntrySchema = z.object({
  /** null heißt „Datum fehlt“ (#116) */
  bestBefore: z
    .object({
      date: calendarDay,
      precision: z.enum(['day', 'month', 'year']),
      isEstimated: z.boolean().default(false),
    })
    .nullable(),
  kind: z.enum(['best-before', 'use-by']).default('best-before'),
  count: z.int().min(1).max(MAX_COUNT_PER_DATE),
})

const per100 = z.number().min(0).max(MAX_PER_100).nullable()
const optionalId = z.uuid().nullable().default(null)

const contentSchema = z.object({
  value: z.number().positive().max(MAX_CONTENT),
  unit: z.enum(['g', 'ml']),
})

const newProductSchema = z.object({
  kind: z.literal('new'),
  foodTypeId: z.uuid(),
  name: z.string().trim().max(MAX_NAME_LENGTH).nullable().default(null),
  content: contentSchema,
  drainedWeightG: z.number().positive().max(MAX_CONTENT).nullable().default(null),
  containerId: optionalId,
  storageLocationId: optionalId,
  nutrition: z
    .object({
      kcal: per100,
      protein: per100,
      carbs: per100,
      fat: per100,
      source: z.enum(['label', 'manual', 'ai-estimate']),
      isConfirmed: z.boolean().default(false),
    })
    .nullable()
    .default(null),
})

export const createStockSchema = z.object({
  /** Idempotenz-Schlüssel: einmal je Erfassung auf dem Gerät erzeugt */
  captureId: z.uuid(),
  method: z.enum(['photo', 'manual']),
  product: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('existing'), productId: z.uuid() }),
    newProductSchema,
  ]),
  units: z.array(unitEntrySchema).min(1).max(MAX_DATES_PER_CAPTURE),
})

/** Suche nach einem passenden Produkt für „Zu Spaghetti 500 g hinzufügen?“ */
export const productMatchQuerySchema = z.object({
  foodTypeId: z.uuid(),
  content: contentSchema,
  containerId: optionalId,
})

export type ProductMatchQuery = z.infer<typeof productMatchQuerySchema>

// ---------- Manuelles Formular (#52, #53) ----------
// Rohwerte des Formulars mit Meldungen je Feld. Die Umwandlung liefert die Eingabe des Speicherns,
// und createStockSchema prüft sie gleich danach noch einmal: auf dem Gerät hier, auf dem Server in
// createStockAction. Nährwerte sind eigene Angaben (`manual`), ohne einen Wert gilt der Richtwert.

const CONTENT_MESSAGES: Record<ContentParseError['kind'], string> = {
  empty: 'Bitte gib den Inhalt einer Packung an, z. B. 500 g.',
  'invalid-number': 'Bitte als Zahl mit Einheit angeben, z. B. 500 g oder 1,5 l.',
  'unknown-unit': 'Bitte mit g, kg, ml oder l angeben, z. B. 500 g.',
  'not-positive': 'Der Inhalt muss größer als 0 sein.',
  'fractional-pieces': 'Bitte den Inhalt in g oder ml angeben.',
  'piece-not-content':
    'Stück zählt als Anzahl der Packungen. Bitte hier den Inhalt in g oder ml angeben.',
}

const contentText = z.string().transform((text, context) => {
  const parsed = parseContentQuantity(text)
  if (parsed.ok) return parsed.value
  context.addIssue({ code: 'custom', message: CONTENT_MESSAGES[parsed.error.kind] })
  return z.NEVER
})

const per100Text = z.string().transform((text, context) => {
  if (text.trim() === '') return null
  const value = parseGermanNumber(text)
  if (value !== null && value >= 0 && value <= MAX_PER_100) return value
  context.addIssue({
    code: 'custom',
    message: 'Bitte eine Zahl ab 0 eingeben, z. B. 359 oder 12,5.',
  })
  return z.NEVER
})

const formUnitSchema = z.object({
  bestBefore: z
    .object({ date: z.string(), precision: z.enum(['day', 'month', 'year']) })
    .nullable(),
  count: z
    .int()
    .min(1)
    .max(MAX_COUNT_PER_DATE, `Höchstens ${String(MAX_COUNT_PER_DATE)} Packungen je Datum.`),
})

const optionalChoice = z.uuid().nullable()

const manualCaptureFormSchema = z.object({
  captureId: z.uuid(),
  foodTypeId: z.uuid({ error: 'Bitte wähle eine Lebensmittelart.' }),
  content: contentText,
  containerId: optionalChoice,
  storageLocationId: optionalChoice,
  /** Gesetzt, wenn „Zu <Produkt> hinzufügen“ gewählt ist (UX §1 „Wiedererkennen“) */
  existingProductId: optionalChoice,
  nutrition: z.object({
    kcal: per100Text,
    protein: per100Text,
    carbs: per100Text,
    fat: per100Text,
  }),
  units: z
    .array(formUnitSchema)
    .min(1, 'Bitte gib ein MHD ein oder wähle „Datum fehlt“.')
    .max(MAX_DATES_PER_CAPTURE, `Höchstens ${String(MAX_DATES_PER_CAPTURE)} Daten je Erfassung.`),
})

type ParsedForm = z.output<typeof manualCaptureFormSchema>

function toNutrition({ nutrition }: ParsedForm) {
  const hasValue = Object.values(nutrition).some((value) => value !== null)
  return hasValue ? { ...nutrition, source: 'manual' as const } : null
}

function toProduct(form: ParsedForm) {
  if (form.existingProductId !== null) {
    return { kind: 'existing' as const, productId: form.existingProductId }
  }
  const { foodTypeId, content, containerId, storageLocationId } = form
  const nutrition = toNutrition(form)
  return { kind: 'new' as const, foodTypeId, content, containerId, storageLocationId, nutrition }
}

/** Formular → Eingabe des Speicherns, geprüft mit demselben Schema wie auf dem Server. */
export const manualCaptureSchema = manualCaptureFormSchema
  .transform((form): z.input<typeof createStockSchema> => ({
    captureId: form.captureId,
    method: 'manual' as const,
    product: toProduct(form),
    units: form.units,
  }))
  .pipe(createStockSchema)
