// Manuelles Formular (#52, #53): Rohwerte des Formulars mit Meldungen je Feld. Die Umwandlung
// liefert die Eingabe des Speicherns, und createStockSchema prüft sie gleich danach noch einmal:
// auf dem Gerät hier, auf dem Server in createStockAction. Nährwerte sind eigene Angaben
// (`manual`), ohne einen Wert gilt der Richtwert.
import { z } from 'zod'
import {
  parseContentQuantity,
  parseGermanNumber,
  type ContentParseError,
} from '@/shared/lib/quantities'
import { createStockSchema, MAX_COUNT_PER_DATE, MAX_DATES_PER_CAPTURE, MAX_PER_100 } from './stock'

const CONTENT_MESSAGES: Record<ContentParseError['kind'], string> = {
  empty: 'Bitte gebt den Inhalt einer Packung an, z. B. 500 g.',
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

export const formUnitSchema = z.object({
  bestBefore: z
    .object({ date: z.string(), precision: z.enum(['day', 'month', 'year']) })
    .nullable(),
  count: z
    .int()
    .min(1)
    .max(MAX_COUNT_PER_DATE, `Höchstens ${String(MAX_COUNT_PER_DATE)} Packungen je Datum.`),
})

const optionalChoice = z.uuid().nullable()

export const manualCaptureFormSchema = z.object({
  captureId: z.uuid(),
  foodTypeId: z.uuid({ error: 'Bitte wählt eine Lebensmittelart.' }),
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
    .min(1, 'Bitte gebt ein MHD ein oder wählt „Datum fehlt“.')
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
