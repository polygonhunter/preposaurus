// Liest Erwartungswerte und Fotos aus dem PoC-Ordner. Jedes Foto läuft durch dieselbe
// Bildverarbeitung wie ein Upload in der App (verkleinern, EXIF samt Standort entfernen), damit
// die KI genau das sieht, was sie auch in der App sähe. Alle Fotos werden vor dem ersten
// KI-Aufruf geladen: Ein fehlendes Foto bricht ab, bevor Kosten entstehen.
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PhotoProcessor } from '../../src/server/storage/photo-processor'
import type { AiImage } from '../../src/server/ai/vision-recognizer'
import { err, ok, type Result } from '../../src/shared/lib/result'
import { parseExpectations, type Expectations } from './expectations'

const EXPECTATIONS_FILE = 'erwartungen.json'
const PHOTO_FOLDER = 'fotos'

const reason = (error: unknown) => (error instanceof Error ? error.message : String(error))

export async function loadExpectations(folder: string): Promise<Result<Expectations, string>> {
  const path = join(folder, EXPECTATIONS_FILE)
  let text: string
  try {
    text = await readFile(path, 'utf8')
  } catch {
    return err(`${path} fehlt. Vorlage: docs/poc/erwartungen.beispiel.json`)
  }
  try {
    return parseExpectations(JSON.parse(text) as unknown)
  } catch (error) {
    return err(`${path} ist kein gültiges JSON: ${reason(error)}`)
  }
}

async function loadImage(
  processor: PhotoProcessor,
  path: string,
): Promise<Result<AiImage, string>> {
  let upload: Uint8Array
  try {
    upload = new Uint8Array(await readFile(path))
  } catch {
    return err(`Foto fehlt: ${path}`)
  }
  const processed = await processor.process(upload)
  if (!processed.ok) return err(`Foto nicht lesbar (${processed.error.kind}): ${path}`)
  return ok({ data: processed.value.full.data, mimeType: processed.value.full.mimeType })
}

export async function loadImages(
  processor: PhotoProcessor,
  input: { folder: string; files: readonly string[] },
): Promise<Result<Map<string, AiImage>, string>> {
  const images = new Map<string, AiImage>()
  for (const file of new Set(input.files)) {
    const image = await loadImage(processor, join(input.folder, PHOTO_FOLDER, file))
    if (!image.ok) return image
    images.set(file, image.value)
  }
  return ok(images)
}
