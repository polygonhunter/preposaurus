// Prüfen-Schritt der Foto-Erfassung (#62 bis #66): dieselben Felder wie das manuelle Formular,
// dazu Bezeichnung, Abtropfgewicht, Herkunft der Nährwerte und Datumsart. Die Umwandlung liefert
// die Eingabe des Speicherns mit `method: 'photo'`. Die Entwurfs-ID ist zugleich `captureId`
// (Idempotenz-Schlüssel) und `draftId`: Beim Speichern werden die Fotos fest (#66).
import { z } from 'zod'
import { parseGermanNumber } from '@/shared/lib/quantities'
import { formUnitSchema, manualCaptureFormSchema } from './manual-capture'
import { createStockSchema, MAX_DATES_PER_CAPTURE } from './stock'

const MAX_NAME_LENGTH = 120
const MAX_DRAINED_G = 9_999_999

const drainedWeightText = z.string().transform((text, context) => {
  if (text.trim() === '') return null
  const value = parseGermanNumber(text.replace(/\s*g$/i, ''))
  if (value !== null && value > 0 && value <= MAX_DRAINED_G) return value
  context.addIssue({ code: 'custom', message: 'Bitte in Gramm als Zahl angeben, z. B. 240.' })
  return z.NEVER
})

const photoUnitSchema = formUnitSchema.extend({
  bestBefore: z
    .object({
      date: z.string(),
      precision: z.enum(['day', 'month', 'year']),
      /** Nur nach „Von der KI schätzen lassen“ (#124) */
      isEstimated: z.boolean().default(false),
    })
    .nullable(),
  kind: z.enum(['best-before', 'use-by']).default('best-before'),
})

const photoCaptureFormSchema = manualCaptureFormSchema.extend({
  draftId: z.uuid(),
  name: z.string().trim().max(MAX_NAME_LENGTH, 'Bitte kürzer, höchstens 120 Zeichen.'),
  drainedWeight: drainedWeightText,
  /** label: vom Etikett gelesen, manual: eingetippt, ai-estimate: Schätzung ohne Tabelle */
  nutritionSource: z.enum(['label', 'manual', 'ai-estimate']),
  isEstimateConfirmed: z.boolean(),
  units: z
    .array(photoUnitSchema)
    .min(1, 'Bitte fotografiere ein MHD, gib eines ein oder wähle „Datum fehlt“.')
    .max(MAX_DATES_PER_CAPTURE, `Höchstens ${String(MAX_DATES_PER_CAPTURE)} Daten je Erfassung.`),
})

type ParsedPhotoForm = z.output<typeof photoCaptureFormSchema>

function toNutrition({ nutrition, nutritionSource, isEstimateConfirmed }: ParsedPhotoForm) {
  const hasValue = Object.values(nutrition).some((value) => value !== null)
  if (!hasValue) return null
  return { ...nutrition, source: nutritionSource, isConfirmed: isEstimateConfirmed }
}

function toProduct(form: ParsedPhotoForm) {
  if (form.existingProductId !== null) {
    return { kind: 'existing' as const, productId: form.existingProductId }
  }
  const { foodTypeId, content, containerId, storageLocationId, name, drainedWeight } = form
  return {
    kind: 'new' as const,
    foodTypeId,
    name: name === '' ? null : name,
    content,
    drainedWeightG: drainedWeight,
    containerId,
    storageLocationId,
    nutrition: toNutrition(form),
  }
}

/** Prüfen-Schritt → Eingabe des Speicherns, geprüft mit demselben Schema wie auf dem Server. */
export const photoCaptureSchema = photoCaptureFormSchema
  .transform((form): z.input<typeof createStockSchema> => ({
    captureId: form.draftId,
    method: 'photo' as const,
    draftId: form.draftId,
    product: toProduct(form),
    units: form.units,
  }))
  .pipe(createStockSchema)
