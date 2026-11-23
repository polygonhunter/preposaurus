// Führt die Messung aus: jedes Foto je Variante über denselben Weg wie die App
// (runRecognitionTask aus capture/application samt Mapping und MHD-Zweitversuch), nur ohne DB und
// Protokoll. Ein Recorder hält Dauer und Tokens jedes Aufrufs fest. Nacheinander, damit die
// gemessene Dauer nicht von parallelen Aufrufen abhängt.
import type { FoodTypeOption } from '../../src/features/capture/data/food-type-options'
import { runRecognitionTask } from '../../src/features/capture/application/photo-recognition-roles'
import type {
  AiCallRecord,
  AiFailure,
  AiImage,
  VisionRecognizer,
} from '../../src/server/ai/vision-recognizer'
import type { PhotoRole } from '../../src/shared/config/constants'
import { comparePhoto } from './compare-photo'
import type { FieldResult } from './compare-values'
import type { Expectations, PhotoExpectation } from './expectations'
import type { Variant } from './run-plan'

export interface PhotoRun {
  photo: string
  role: PhotoRole
  variant: string
  /** Ein Aufruf, beim MHD mit Zweitversuch zwei */
  calls: AiCallRecord[]
  failure: AiFailure['kind'] | null
  fields: FieldResult[]
}

export interface PocDeps {
  recognizer: VisionRecognizer
  /** Bereits geladene, verkleinerte Fotos ohne EXIF, Schlüssel ist `datei` */
  images: ReadonlyMap<string, AiImage>
  /** Erlaubte Lebensmittelarten (System-Arten aus den Stammdaten) */
  foodTypes: readonly FoodTypeOption[]
  onProgress?: (line: string) => void
}

function recordingRecognizer(inner: VisionRecognizer, calls: AiCallRecord[]): VisionRecognizer {
  return {
    recognize: async (request) => {
      const outcome = await inner.recognize(request)
      calls.push(outcome.call)
      return outcome
    },
  }
}

function imageFor(deps: PocDeps, photo: PhotoExpectation): AiImage {
  const image = deps.images.get(photo.datei)
  if (image === undefined) throw new Error(`Foto nicht geladen: ${photo.datei}`)
  return image
}

async function runPhoto(
  deps: PocDeps,
  photo: PhotoExpectation,
  context: { variant: Variant; tolerance: Expectations['toleranz'] },
): Promise<PhotoRun> {
  const calls: AiCallRecord[] = []
  const prepared = {
    recognizer: recordingRecognizer(deps.recognizer, calls),
    models: context.variant.models,
  }
  const run = {
    prepared,
    image: imageFor(deps, photo),
    loadFoodTypes: () => Promise.resolve([...deps.foodTypes]),
  }
  const outcome = await runRecognitionTask(run, photo.rolle)
  return {
    photo: photo.datei,
    role: photo.rolle,
    variant: context.variant.label,
    calls,
    failure: outcome.ok ? null : outcome.error.kind,
    fields: comparePhoto(photo, outcome, context.tolerance),
  }
}

export async function runPoc(
  deps: PocDeps,
  plan: { expectations: Expectations; variants: readonly Variant[] },
): Promise<PhotoRun[]> {
  const runs: PhotoRun[] = []
  const tolerance = plan.expectations.toleranz
  for (const variant of plan.variants) {
    const photos = plan.expectations.fotos.filter((photo) => photo.rolle === variant.role)
    for (const [index, photo] of photos.entries()) {
      deps.onProgress?.(
        `${variant.role} · ${variant.label} · ${String(index + 1)}/${String(photos.length)} ${photo.datei}`,
      )
      runs.push(await runPhoto(deps, photo, { variant, tolerance }))
    }
  }
  return runs
}
