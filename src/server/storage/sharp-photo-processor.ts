// Adapter: Bildverarbeitung mit sharp. Einzige Datei, die sharp kennt.
// sharp schreibt ohne ausdrücklichen Wunsch keine Metadaten (EXIF, GPS, XMP, ICC) in die Ausgabe.
// Vorher dreht autoOrient das Bild nach der EXIF-Ausrichtung, damit es ohne EXIF richtig steht.
import 'server-only'
import sharp from 'sharp'
import { err, ok, type Result } from '@/shared/lib/result'
import {
  checkUpload,
  FULL_LONG_EDGE_PX,
  THUMBNAIL_LONG_EDGE_PX,
  type PhotoProcessor,
  type PhotoRejection,
  type ProcessedImage,
  type ProcessedPhoto,
} from './photo-processor'

/** Schutz vor „Pixelbomben“: kleine Datei, riesige Fläche. 100 MP reichen für jedes Handyfoto. */
const MAX_INPUT_PIXELS = 100_000_000
const FULL_QUALITY = 82
const THUMBNAIL_QUALITY = 75

async function encode(
  input: Uint8Array,
  longEdge: number,
  quality: number,
): Promise<ProcessedImage> {
  const { data, info } = await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .autoOrient()
    .resize({ width: longEdge, height: longEdge, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer({ resolveWithObject: true })
  return {
    data: new Uint8Array(data),
    mimeType: 'image/jpeg',
    width: info.width,
    height: info.height,
  }
}

async function encodeBoth(input: Uint8Array): Promise<ProcessedPhoto> {
  const [full, thumbnail] = await Promise.all([
    encode(input, FULL_LONG_EDGE_PX, FULL_QUALITY),
    encode(input, THUMBNAIL_LONG_EDGE_PX, THUMBNAIL_QUALITY),
  ])
  return { full, thumbnail }
}

async function processUpload(upload: Uint8Array): Promise<Result<ProcessedPhoto, PhotoRejection>> {
  const checked = checkUpload(upload)
  if (!checked.ok) return checked
  try {
    return ok(await encodeBoth(upload))
  } catch {
    // Beschädigte Datei oder fehlender Decoder (HEIC): erwarteter Fehler, die Oberfläche bietet
    // „erneut versuchen“ bzw. „manuell“. Inhalte des Bildes gehören nicht ins Log.
    return err({ kind: 'unreadable' })
  }
}

export function createSharpPhotoProcessor(): PhotoProcessor {
  return { process: processUpload }
}
