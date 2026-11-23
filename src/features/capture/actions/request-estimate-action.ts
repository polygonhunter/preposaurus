'use server'
// KI-Schätzung auf ausdrückliche Wahl (#124): „Von der KI schätzen lassen“ beim MHD und „Keine
// Nährwerttabelle“ bei den Nährwerten. Dünne Hülle: Sitzung, Eingabe, Use-Case, ruhiger Text.
// Das Ergebnis ist ein gekennzeichneter Vorschlag, gespeichert wird erst beim Speichern.
import type { BestBefore } from '@/features/inventory/domain/unit'
import type { NutritionValues } from '@/features/inventory/domain/nutrition-source'
import { loadCaptureDeps } from '../application/capture-deps'
import { requireCaptureActor } from '../application/capture-actor'
import { requestEstimate, type RequestEstimateError } from '../application/request-estimate'
import { estimateRequestSchema } from '../schemas/photos'
import { failedMessage, unavailableMessage } from './ai-messages'
import { accessMessage, failure } from './action-messages'

export type EstimateState =
  | { ok: true; target: 'mhd'; bestBefore: BestBefore }
  | { ok: true; target: 'naehrwerte'; nutrition: NutritionValues }
  | { ok: false; message: string }

const NO_ESTIMATE = {
  mhd: 'Die KI kann hier nichts Sinnvolles schätzen. Es bleibt bei „Datum fehlt“.',
  naehrwerte: 'Die KI kann hier nichts Sinnvolles schätzen. Es gilt der Richtwert der Art.',
} as const

function errorMessage(error: RequestEstimateError, target: keyof typeof NO_ESTIMATE): string {
  switch (error.kind) {
    case 'not-found':
      return 'Für eine Schätzung braucht es ein Foto der Verpackung.'
    case 'ai-unavailable':
      return unavailableMessage(error.reason)
    case 'ai-failed':
      return failedMessage(error.failure)
    case 'no-estimate':
      return NO_ESTIMATE[target]
  }
}

export async function requestEstimateAction(input: unknown): Promise<EstimateState> {
  const actor = await requireCaptureActor()
  if (!actor.ok) return failure(accessMessage(actor.error))
  const parsed = estimateRequestSchema.safeParse(input)
  if (!parsed.success) return failure('Die Schätzung ließ sich nicht anfragen.')
  const { fotoId, ziel, lebensmittelartId, bezeichnung } = parsed.data
  const result = await requestEstimate(
    { ...(await loadCaptureDeps()), now: () => new Date() },
    {
      actor: actor.value,
      photoId: fotoId,
      target: ziel,
      foodTypeId: lebensmittelartId,
      productName: bezeichnung,
    },
  )
  if (!result.ok) return failure(errorMessage(result.error, ziel))
  return result.value.target === 'mhd'
    ? { ok: true, target: 'mhd', bestBefore: result.value.bestBefore.bestBefore }
    : { ok: true, target: 'naehrwerte', nutrition: result.value.nutrition.values }
}
