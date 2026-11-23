// Format der Erwartungswerte für das PoC-Messskript (#103): poc/erwartungen.json, nicht im
// Repository. Beispiel mit erfundenen Werten: docs/poc/erwartungen.beispiel.json.
// Regel je Feld: fehlt es, wird es nicht bewertet. `null` heißt „steht nicht drauf bzw. ist
// unlesbar“, dann ist nur `null` als Antwort richtig. Ein Wert heißt „so steht es drauf“.
import { z } from 'zod'
import { CONTAINER_KEYS, type PhotoRole } from '../../src/shared/config/constants'
import { err, ok, type Result } from '../../src/shared/lib/result'

/** JJJJ-MM-TT (Tag), JJJJ-MM (nur Monat) oder JJJJ (nur Jahr), wie aufgedruckt. */
const printedDate = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Datum als JJJJ-MM-TT, JJJJ-MM oder JJJJ')

const nutrient = z.number().nonnegative().nullable().optional()

const packagingExpectation = z.strictObject({
  lebensmittelart: z.string().min(1).nullable().optional(),
  behaelter: z.enum(CONTAINER_KEYS).nullable().optional(),
  inhalt: z
    .strictObject({ wert: z.number().positive(), einheit: z.enum(['g', 'ml']) })
    .nullable()
    .optional(),
})

/** Je 100 g bzw. 100 ml, wie in der App nach dem Umrechnen einer Portion. */
const nutritionExpectation = z.strictObject({
  kcal: nutrient,
  eiweiss_g: nutrient,
  kohlenhydrate_g: nutrient,
  fett_g: nutrient,
})

const bestBeforeExpectation = z.strictObject({
  /** Pflicht: Das MHD ist die wichtigste Kennzahl. null = unlesbar oder nicht aufgedruckt */
  datum: printedDate.nullable(),
  art: z.enum(['mhd', 'verbrauchen_bis']).nullable().optional(),
})

/** Relativer Pfad unter poc/fotos/, ohne „..“ und ohne führenden Schrägstrich. */
const photoFile = z
  .string()
  .min(1)
  .refine(
    (file) => !file.startsWith('/') && !file.split(/[\\/]/).includes('..'),
    'Pfad relativ zu poc/fotos/ angeben, ohne „..“',
  )

const photoBase = { datei: photoFile, notiz: z.string().optional() }

const photoExpectation = z.discriminatedUnion('rolle', [
  z.strictObject({ ...photoBase, rolle: z.literal('verpackung'), erwartet: packagingExpectation }),
  z.strictObject({ ...photoBase, rolle: z.literal('naehrwerte'), erwartet: nutritionExpectation }),
  z.strictObject({ ...photoBase, rolle: z.literal('mhd'), erwartet: bestBeforeExpectation }),
])

const DEFAULT_TOLERANCE = { relativ: 0.05, absolut: 0.5 }

const expectationsSchema = z.strictObject({
  /** Nährwerte und Inhalt gelten als Treffer innerhalb max(absolut, relativ × Erwartung) */
  toleranz: z
    .strictObject({ relativ: z.number().min(0), absolut: z.number().min(0) })
    .default(DEFAULT_TOLERANCE),
  fotos: z.array(photoExpectation).min(1, 'Mindestens ein Foto eintragen'),
})

export type PhotoExpectation = z.infer<typeof photoExpectation>
export type PackagingExpectation = z.infer<typeof packagingExpectation>
export type NutritionExpectation = z.infer<typeof nutritionExpectation>
export type BestBeforeExpectation = z.infer<typeof bestBeforeExpectation>
export type Expectations = z.infer<typeof expectationsSchema>
export type Tolerance = Expectations['toleranz']

export const rolesIn = (expectations: Expectations): PhotoRole[] => [
  ...new Set(expectations.fotos.map((photo) => photo.rolle)),
]

export function parseExpectations(raw: unknown): Result<Expectations, string> {
  const parsed = expectationsSchema.safeParse(raw)
  if (!parsed.success) {
    return err(`Erwartungswerte ungültig:\n${z.prettifyError(parsed.error)}`)
  }
  // Dasselbe Foto darf für mehrere Rollen stehen (z. B. Verpackung und MHD), je Rolle aber nur einmal.
  const keys = parsed.data.fotos.map((photo) => `${photo.datei} (${photo.rolle})`)
  const duplicate = keys.find((key, index) => keys.indexOf(key) !== index)
  if (duplicate !== undefined) return err(`Foto doppelt eingetragen: ${duplicate}`)
  return ok(parsed.data)
}
