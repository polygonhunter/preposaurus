// Ablauf des Messskripts: Umgebung und Verbindung prüfen, Erwartungen und Fotos laden, messen,
// Bericht schreiben. Ohne process.argv und ohne Prozess-Ende, damit ein Test den Trockenlauf
// komplett durchspielen kann.
import { SYSTEM_FOOD_TYPES } from '../../db/seeds/stammdaten/lebensmittelarten'
import { createSharpPhotoProcessor } from '../../src/server/storage/sharp-photo-processor'
import { loadRecognitionPocEnv } from '../../src/shared/config/env'
import { err, ok, type Result } from '../../src/shared/lib/result'
import type { PocOptions } from './cli-options'
import { connectRecognizer } from './connection'
import { rolesIn } from './expectations'
import { loadExpectations, loadImages } from './load-inputs'
import { planVariants } from './run-plan'
import { runPoc } from './run-recognition'
import { summarize } from './summarize'
import { writeReport } from './write-report'

export interface MeasureDeps {
  print: (line: string) => void
  /** Nur Tests: Umgebung statt process.env */
  envSource?: Readonly<Record<string, string | undefined>>
  /** Nur Tests: fester Zeitpunkt für den Dateinamen */
  now?: () => Date
}

const DRY_RUN_NOTICE =
  'Trockenlauf mit Fake-KI (AI_PROVIDER=fake): keine Kosten, keine echten Werte. Für die Messung AI_PROVIDER=anthropic setzen.'

async function prepare(options: PocOptions, deps: MeasureDeps) {
  const env =
    deps.envSource === undefined ? loadRecognitionPocEnv() : loadRecognitionPocEnv(deps.envSource)
  if (!env.ok) return env
  const connection = connectRecognizer(env.value)
  if (!connection.ok) return connection
  const expectations = await loadExpectations(options.folder)
  if (!expectations.ok) return expectations
  const roles = rolesIn(expectations.value).filter((role) => options.roles?.includes(role) ?? true)
  if (roles.length === 0) return err('Für die gewählten Rollen sind keine Fotos eingetragen.')
  const photos = expectations.value.fotos.filter((photo) => roles.includes(photo.rolle))
  const images = await loadImages(createSharpPhotoProcessor(), {
    folder: options.folder,
    files: photos.map((photo) => photo.datei),
  })
  if (!images.ok) return images
  const variants = planVariants({ ...options, roles })
  return ok({
    ...connection.value,
    expectations: expectations.value,
    images: images.value,
    variants,
  })
}

export async function measureRecognition(
  options: PocOptions,
  deps: MeasureDeps,
): Promise<Result<string, string>> {
  const { print } = deps
  const ready = await prepare(options, deps)
  if (!ready.ok) return ready
  const { recognizer, isDryRun, expectations, images, variants } = ready.value
  if (isDryRun) print(DRY_RUN_NOTICE)
  const foodTypes = SYSTEM_FOOD_TYPES.map(({ key, name }) => ({ key, name }))
  const runs = await runPoc(
    { recognizer, images, foodTypes, onProgress: print },
    { expectations, variants },
  )
  const meta = {
    createdAt: deps.now?.() ?? new Date(),
    folder: options.folder,
    isDryRun,
    tolerance: expectations.toleranz,
  }
  const paths = await writeReport({ meta, summaries: summarize(runs), runs })
  return ok(`Bericht geschrieben:\n  ${paths.markdown}\n  ${paths.json}`)
}
