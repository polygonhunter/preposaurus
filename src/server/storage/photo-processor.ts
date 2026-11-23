// Port für die Bildverarbeitung vor dem Speichern (technik.html „Wann wird gespeichert“, „Sicherheit“):
// verkleinern, Vorschaubild erzeugen, EXIF samt Standort entfernen. Das Original wird nie gespeichert.
import { err, ok, type Result } from '@/shared/lib/result'
import type { StoredPhotoType } from './photo-storage'

/** Größte angenommene Datei. Ein 48-MP-Handyfoto liegt deutlich darunter. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
export const FULL_LONG_EDGE_PX = 1600
export const THUMBNAIL_LONG_EDGE_PX = 400

/** Angenommene Typen, erkannt am Dateianfang, nie an Endung oder Angabe des Browsers. */
type UploadType = 'jpeg' | 'png' | 'webp' | 'heic'

export type PhotoRejection =
  | { kind: 'empty' }
  | { kind: 'too-large'; maxBytes: number }
  | { kind: 'unsupported-type' }
  /** Typ passt, aber das Bild lässt sich nicht lesen (beschädigt, HEIC ohne Decoder) */
  | { kind: 'unreadable' }

export interface ProcessedImage {
  data: Uint8Array
  mimeType: StoredPhotoType
  width: number
  height: number
}

export interface ProcessedPhoto {
  full: ProcessedImage
  thumbnail: ProcessedImage
}

export interface PhotoProcessor {
  process: (upload: Uint8Array) => Promise<Result<ProcessedPhoto, PhotoRejection>>
}

const startsWith = (data: Uint8Array, bytes: readonly number[], offset = 0) =>
  bytes.every((byte, index) => data[offset + index] === byte)

const ascii = (data: Uint8Array, from: number, to: number) =>
  String.fromCharCode(...data.subarray(from, to))

const JPEG = [0xff, 0xd8, 0xff]
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
/** HEVC-Marken von HEIC-Fotos (iPhone). */
const HEIC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis'])
/** Allgemeine HEIF-Marken. Sie tragen auch AVIF-Dateien und zählen nur mit einer HEVC-Marke. */
const GENERIC_HEIF_BRANDS = new Set(['mif1', 'msf1'])
const BRAND_LENGTH = 4
const FTYP_COMPATIBLE_START = 16

/** Kompatible Marken der ftyp-Box (nach Hauptmarke und Version). */
function compatibleBrands(data: Uint8Array): string[] {
  // Nur nach erkannter ftyp-Box aufgerufen, die ersten 12 Bytes sind also da.
  const boxSize = new DataView(data.buffer, data.byteOffset, data.byteLength).getUint32(0)
  const end = Math.min(boxSize, data.byteLength)
  const brands: string[] = []
  for (let offset = FTYP_COMPATIBLE_START; offset + BRAND_LENGTH <= end; offset += BRAND_LENGTH) {
    brands.push(ascii(data, offset, offset + BRAND_LENGTH))
  }
  return brands
}

/**
 * HEIC ja, AVIF nein (#55: nur JPEG, PNG, WebP und HEIC). Handykameras liefern kein AVIF, und
 * jedes weitere Format ist ein weiterer Decoder, der fremde Dateien parst. Eine Datei mit
 * allgemeiner Marke (`mif1`) gilt nur als HEIC, wenn sie eine HEVC-Marke und keine AVIF-Marke trägt.
 */
function isHeic(data: Uint8Array): boolean {
  if (ascii(data, 4, 8) !== 'ftyp') return false
  const major = ascii(data, 8, 12)
  if (HEIC_BRANDS.has(major)) return true
  if (!GENERIC_HEIF_BRANDS.has(major)) return false
  const brands = compatibleBrands(data)
  return brands.some((brand) => HEIC_BRANDS.has(brand)) && !brands.includes('avif')
}

/**
 * Erkennt den Bildtyp an den ersten Bytes. Unbekanntes ergibt null.
 * @internal Nur für Tests exportiert, im Code nur in dieser Datei genutzt.
 */
export function detectUploadType(data: Uint8Array): UploadType | null {
  if (startsWith(data, JPEG)) return 'jpeg'
  if (startsWith(data, PNG)) return 'png'
  if (ascii(data, 0, 4) === 'RIFF' && ascii(data, 8, 12) === 'WEBP') return 'webp'
  if (isHeic(data)) return 'heic'
  return null
}

/** Prüfungen vor dem Dekodieren: leer, zu groß, falscher Typ. */
export function checkUpload(data: Uint8Array): Result<UploadType, PhotoRejection> {
  if (data.byteLength === 0) return err({ kind: 'empty' })
  if (data.byteLength > MAX_UPLOAD_BYTES)
    return err({ kind: 'too-large', maxBytes: MAX_UPLOAD_BYTES })
  const type = detectUploadType(data)
  return type === null ? err({ kind: 'unsupported-type' }) : ok(type)
}
