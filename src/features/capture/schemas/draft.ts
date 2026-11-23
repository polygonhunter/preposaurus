// Entwurf der Erfassung (M6-03): der Stand der Maske, gesichert bei jedem Schrittwechsel.
// Vorläufig, bis die Schritte (M6-08 bis M6-11) stehen: alles optional, aber mit festen Grenzen,
// damit kein beliebiges JSON in `erfassung_entwurf.daten` landet. Fotos hängen über
// `foto.entwurf_id` am Entwurf und stehen deshalb nicht hier.
import { z } from 'zod'
import {
  BEST_BEFORE_KINDS,
  BEST_BEFORE_PRECISIONS,
  CAPTURE_METHODS,
  CONTAINER_KEYS,
} from '@/shared/config/constants'

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
