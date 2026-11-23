// KI-Schätzung auf ausdrückliche Wahl (#124, #115, #116): verdrahtet die Knöpfe „Von der KI
// schätzen lassen“ (MHD bei „Datum fehlt“) und „Keine Nährwerttabelle“ mit estimate-on-request.
// Grundlage ist das Verpackungsfoto aus dem eigenen Entwurf samt gewählter Art und Bezeichnung.
// Ohne Verpackungsfoto gibt es keine Schätzung. Gespeichert wird nichts, es bleibt ein Vorschlag.
import 'server-only'
import type { AiFailure } from '@/server/ai/vision-recognizer'
import { todayInBerlin } from '@/shared/lib/dates'
import { err, ok, type Result } from '@/shared/lib/result'
import { findFoodTypeOption } from '../data/food-type-options'
import type { CaptureActor } from './capture-actor'
import type { CaptureDeps } from './capture-deps'
import {
  estimateBestBefore,
  estimateNutrition,
  type EstimatedBestBefore,
  type EstimatedNutrition,
} from './estimate-on-request'
import { prepareDraftPhoto, type DraftPhotoError } from './prepare-draft-photo'

type EstimateTarget = 'mhd' | 'naehrwerte'

interface RequestEstimateInput {
  actor: CaptureActor
  /** Verpackungsfoto des Entwurfs */
  photoId: string
  target: EstimateTarget
  foodTypeId: string | null
  productName: string | null
}

export type RequestEstimateError =
  DraftPhotoError | { kind: 'ai-failed'; failure: AiFailure['kind'] } | { kind: 'no-estimate' }

export type EstimateResult =
  | { target: 'mhd'; bestBefore: EstimatedBestBefore }
  | { target: 'naehrwerte'; nutrition: EstimatedNutrition }

type EstimateDeps = Pick<CaptureDeps, 'db' | 'storage' | 'env'> & { now: () => Date }

const ROLE = { mhd: 'mhd_schaetzen', naehrwerte: 'naehrwerte_schaetzen' } as const

function failed(error: AiFailure | { kind: 'no-estimate' }): RequestEstimateError {
  return error.kind === 'no-estimate' ? error : { kind: 'ai-failed', failure: error.kind }
}

export async function requestEstimate(
  deps: EstimateDeps,
  input: RequestEstimateInput,
): Promise<Result<EstimateResult, RequestEstimateError>> {
  const role = ROLE[input.target]
  const ready = await prepareDraftPhoto(deps, {
    ...input,
    rolesFor: () => ({ required: [role], optional: [] }),
  })
  if (!ready.ok) return ready
  // Nur das Verpackungsfoto zeigt, was es ist. Ein MHD-Foto taugt nicht als Grundlage.
  if (ready.value.photo.role !== 'verpackung') return err({ kind: 'not-found' })
  const { photo, prepared, image } = ready.value
  const foodType =
    input.foodTypeId === null
      ? null
      : await findFoodTypeOption(deps.db, photo.householdId, input.foodTypeId)
  const model = prepared.models[role] ?? ''
  const request = {
    recognizer: prepared.recognizer,
    image,
    model,
    context: { foodType, productName: input.productName },
  }
  if (input.target === 'mhd') {
    const estimate = await estimateBestBefore({ ...request, today: todayInBerlin(deps.now()) })
    return estimate.ok
      ? ok({ target: 'mhd', bestBefore: estimate.value })
      : err(failed(estimate.error))
  }
  const estimate = await estimateNutrition(request)
  return estimate.ok
    ? ok({ target: 'naehrwerte', nutrition: estimate.value })
    : err(failed(estimate.error))
}
