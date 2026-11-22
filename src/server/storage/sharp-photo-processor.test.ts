import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import {
  checkUpload,
  detectUploadType,
  FULL_LONG_EDGE_PX,
  MAX_UPLOAD_BYTES,
  THUMBNAIL_LONG_EDGE_PX,
} from './photo-processor'
import { createSharpPhotoProcessor } from './sharp-photo-processor'

// TESTDATEN: kleines HEIC (HEVC), mit macOS `sips` aus einem einfarbigen JPEG erzeugt
const HEIC_BASE64 =
  'AAAAJGZ0eXBoZWljAAAAAG1pZjFNaVBybWlhZk1pSEJoZWljAAABhm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAHBpY3QAAAAA' +
  'AAAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAADnBpdG0AAAAAAAEAAAAjaWluZgAAAAAA' +
  'AQAAABVpbmZlAgAAAAABAABodmMxAAAAAOZpcHJwAAAAxWlwY28AAAATY29scm5jbHgAAgACAAaAAAAADGNsbGkAywBAAAAA' +
  'FGlzcGUAAAAAAAAAQAAAADAAAAAJaXJvdAAAAAAQcGl4aQAAAAADCAgIAAAAcWh2Y0MBA3AAAACwAAAAAAAe8AD8/fj4AAAL' +
  'A6AAAQAXQAEMAf//A3AAAAMAsAAAAwAAAwAecCShAAEAI0IBAQNwAAADALAAAAMAAAMAHqAUIEHBjE4h7kWVTcCAgYAgogAB' +
  'AAlEAcBhcshAUyQAAAAZaXBtYQAAAAAAAAABAAEGgQIDhAWGAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAAboAAAA+AAAAAW1k' +
  'YXQAAAAAAAAATgAAADooAa+i9kbFdW27D//BF8hxFmM9xE//8qYj/6Vr//neE/p/9CJ+sRBv//bQ//7JaX+dEq0ozX4ZK34w'

const solid = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: '#c84' } })

/** Testfoto wie vom Handy: Kamera, GPS-Standort und Ausrichtung „90° gedreht“ im EXIF. */
async function photoWithGps(width: number, height: number): Promise<Uint8Array> {
  const data = await solid(width, height)
    .withMetadata({ orientation: 6 })
    .withExif({
      IFD0: { Make: 'TestKamera', Model: 'Handy 1' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '52/1 31/1 0/1' },
    })
    .jpeg()
    .toBuffer()
  return new Uint8Array(data)
}

const processor = createSharpPhotoProcessor()

async function processOk(upload: Uint8Array) {
  const result = await processor.process(upload)
  if (!result.ok) throw new Error(`Abgelehnt: ${result.error.kind}`)
  return result.value
}

describe('createSharpPhotoProcessor', () => {
  it('entfernt EXIF samt GPS und richtet das Bild vorher nach der Ausrichtung aus', async () => {
    const upload = await photoWithGps(300, 200)
    const before = await sharp(upload).metadata()
    expect(before.exif?.toString('latin1')).toContain('TestKamera')
    expect(before.orientation).toBe(6)

    const { full, thumbnail } = await processOk(upload)

    for (const image of [full, thumbnail]) {
      const after = await sharp(image.data).metadata()
      expect(after.exif).toBeUndefined()
      expect(after.xmp).toBeUndefined()
      expect(after.iptc).toBeUndefined()
      expect(after.orientation).toBeUndefined()
    }
    expect([full.width, full.height]).toEqual([200, 300])
  })

  it('verkleinert auf 1600 px lange Kante und erzeugt ein Vorschaubild mit 400 px', async () => {
    const upload = new Uint8Array(await solid(4000, 3000).png().toBuffer())

    const { full, thumbnail } = await processOk(upload)

    expect(full).toMatchObject({ mimeType: 'image/jpeg', width: FULL_LONG_EDGE_PX, height: 1200 })
    expect(thumbnail).toMatchObject({ width: THUMBNAIL_LONG_EDGE_PX, height: 300 })
    expect((await sharp(full.data).metadata()).format).toBe('jpeg')
  })

  it('vergrößert kleine Bilder nicht', async () => {
    const upload = new Uint8Array(await solid(320, 240).webp().toBuffer())

    const { full, thumbnail } = await processOk(upload)

    expect([full.width, full.height]).toEqual([320, 240])
    expect([thumbnail.width, thumbnail.height]).toEqual([320, 240])
  })

  it('lehnt einen falschen Dateityp ab, auch mit Bild-Endung', async () => {
    const gif = new Uint8Array(await solid(10, 10).gif().toBuffer())
    const pdf = new TextEncoder().encode('%PDF-1.7 kein Bild')

    expect(await processor.process(gif)).toEqual({ ok: false, error: { kind: 'unsupported-type' } })
    expect(await processor.process(pdf)).toEqual({ ok: false, error: { kind: 'unsupported-type' } })
  })

  it('meldet ein beschädigtes Bild als nicht lesbar', async () => {
    const broken = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])

    expect(await processor.process(broken)).toEqual({ ok: false, error: { kind: 'unreadable' } })
  })

  it('erkennt HEIC, meldet es ohne HEVC-Decoder in sharp aber als nicht lesbar', async () => {
    const heic = new Uint8Array(Buffer.from(HEIC_BASE64, 'base64'))

    expect(detectUploadType(heic)).toBe('heic')
    expect(await processor.process(heic)).toEqual({ ok: false, error: { kind: 'unreadable' } })
  })
})

describe('checkUpload', () => {
  it('lehnt eine leere Datei ab', () => {
    expect(checkUpload(new Uint8Array())).toEqual({ ok: false, error: { kind: 'empty' } })
  })

  it('lehnt eine zu große Datei ab, bevor sie dekodiert wird', () => {
    const tooLarge = new Uint8Array(MAX_UPLOAD_BYTES + 1)
    tooLarge.set([0xff, 0xd8, 0xff])

    expect(checkUpload(tooLarge)).toEqual({
      ok: false,
      error: { kind: 'too-large', maxBytes: MAX_UPLOAD_BYTES },
    })
  })

  it('erkennt JPEG, PNG und WebP am Dateianfang', async () => {
    const jpeg = new Uint8Array(await solid(4, 4).jpeg().toBuffer())
    const png = new Uint8Array(await solid(4, 4).png().toBuffer())
    const webp = new Uint8Array(await solid(4, 4).webp().toBuffer())
    const avif = new Uint8Array(await solid(4, 4).avif().toBuffer())

    expect([jpeg, png, webp].map((data) => checkUpload(data))).toEqual([
      { ok: true, value: 'jpeg' },
      { ok: true, value: 'png' },
      { ok: true, value: 'webp' },
    ])
    expect(detectUploadType(avif)).toBeNull()
  })
})
