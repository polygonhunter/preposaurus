// Schemas der Erfassung: KI-Antworten, Foto-Routen und Entwurf.
// KI-Schemas der Foto-Erkennung (technik.html#api-ki). Einzige Quelle für Structured Output und
// für die Prüfung der Antwort. Bewusst schlank: alle Felder Pflicht und nullable, keine Zahlen-
// oder Längengrenzen, weil Anthropic sie nicht unterstützt. Die Grenzen prüft danach das Mapping
// in capture/domain (map-recognition.ts, map-best-before-recognition.ts).
import { z } from 'zod'
import {
  AI_CONFIDENCE_LEVELS,
  BEST_BEFORE_KINDS,
  BEST_BEFORE_PRECISIONS,
  CAPTURE_METHODS,
  CONTAINER_KEYS,
  PHOTO_ROLES,
} from '@/shared/config/constants'

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

/** Body von `POST /api/recognize`. `schaetzung` nur auf ausdrückliche Wahl „keine Tabelle“ (#124). */
export const recognizeRequestSchema = z.strictObject({
  fotoId: z.uuid(),
  schaetzung: z
    .strictObject({
      lebensmittelart: z.string().max(80).nullable(),
      bezeichnung: z.string().trim().max(120).nullable(),
    })
    .optional(),
})

// Entwurf der Erfassung (M6-03): der Stand der Maske, gesichert bei jedem Schrittwechsel.
// Vorläufig, bis die Schritte (M6-08 bis M6-11) stehen: alles optional, aber mit festen Grenzen,
// damit kein beliebiges JSON in `erfassung_entwurf.daten` landet. Fotos hängen über
// `foto.entwurf_id` am Entwurf und stehen deshalb nicht hier.
const DRAFT_STEPS = ['verpackung', 'naehrwerte', 'mhd', 'zusammenfassung'] as const
const MAX_DRAFT_AMOUNT = 1_000_000
const MAX_DRAFT_DATES = 200
const MAX_UNITS_PER_DATE = 999

const draftAmount = z.number().nonnegative().max(MAX_DRAFT_AMOUNT).nullable().optional()
const draftId = z.uuid().nullable().optional()

const draftPackagingSchema = z.strictObject({
  bezeichnung: z.string().trim().max(120).nullable().optional(),
  kategorieId: draftId,
  lebensmittelartId: draftId,
  behaelter: z.enum(CONTAINER_KEYS).nullable().optional(),
  inhaltWert: draftAmount,
  inhaltEinheit: z.enum(['g', 'ml']).nullable().optional(),
  abtropfgewichtG: draftAmount,
})

const draftNutritionSchema = z.strictObject({
  kcal: draftAmount,
  eiweissG: draftAmount,
  kohlenhydrateG: draftAmount,
  fettG: draftAmount,
  geschaetzt: z.boolean().optional(),
})

/** Ein Datums-Chip der MHD-Serie. Ohne Datum bleibt `datum` null, nie erfunden. */
const draftBestBeforeSchema = z.strictObject({
  datum: z.iso.date().nullable(),
  genauigkeit: z.enum(BEST_BEFORE_PRECISIONS).nullable().optional(),
  art: z.enum(BEST_BEFORE_KINDS).nullable().optional(),
  anzahl: z.int().min(1).max(MAX_UNITS_PER_DATE),
  fotoId: draftId,
  ohneDatum: z.boolean().optional(),
})

export const captureDraftDataSchema = z.strictObject({
  schritt: z.enum(DRAFT_STEPS).optional(),
  weg: z.enum(CAPTURE_METHODS).optional(),
  verpackung: draftPackagingSchema.optional(),
  naehrwerte: draftNutritionSchema.optional(),
  mhd: z.array(draftBestBeforeSchema).max(MAX_DRAFT_DATES).optional(),
})

/** `saveDraftAction`: ohne `entwurfId` der neueste Entwurf des Nutzers, sonst ein neuer. */
export const saveDraftInputSchema = z.strictObject({
  entwurfId: z.uuid().optional(),
  daten: captureDraftDataSchema,
})

export const discardDraftInputSchema = z.strictObject({ entwurfId: z.uuid() })

export type CaptureDraftData = z.infer<typeof captureDraftDataSchema>
export type PackagingAnswer = z.infer<ReturnType<typeof packagingAnswerSchema>>
export type NutritionAnswer = z.infer<typeof nutritionAnswerSchema>
export type NutritionEstimateAnswer = z.infer<typeof nutritionEstimateAnswerSchema>
export type BestBeforeAnswer = z.infer<typeof bestBeforeAnswerSchema>
