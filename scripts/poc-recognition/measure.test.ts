// Trockenlauf mit Fake-KI: kein Netz, kein Schlüssel, keine Kosten.
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFakeVisionRecognizer } from '../../src/server/ai/fake-vision-recognizer'
import { parsePocArgs, type PocOptions } from './cli-options'
import { parseExpectations, type Expectations } from './expectations'
import { measureRecognition } from './measure'
import { planVariants } from './run-plan'
import { runPoc } from './run-recognition'

const EXPECTATIONS = {
  fotos: [
    { datei: 'mhd/unlesbar.png', rolle: 'mhd', erwartet: { datum: null } },
    { datei: 'verpackung/dose.png', rolle: 'verpackung', erwartet: { behaelter: 'dose' } },
  ],
}

async function writePhoto(folder: string, file: string): Promise<void> {
  const path = join(folder, 'fotos', file)
  await mkdir(join(path, '..'), { recursive: true })
  const background = { r: 200, g: 180, b: 120 }
  const image = sharp({ create: { width: 40, height: 30, channels: 3, background } })
  await writeFile(path, await image.png().toBuffer())
}

function optionsFor(folder: string, args: string[] = []): PocOptions {
  const parsed = parsePocArgs(['--ordner', folder, '--modelle', 'haiku', ...args])
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.value
}

describe('measureRecognition · Trockenlauf', () => {
  let folder: string
  const lines: string[] = []
  const deps = {
    print: (line: string) => lines.push(line),
    envSource: { AI_PROVIDER: 'fake' },
    now: () => new Date('2026-11-23T10:00:00Z'),
  }

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'poc-'))
    lines.length = 0
    await writeFile(join(folder, 'erwartungen.json'), JSON.stringify(EXPECTATIONS))
    await writePhoto(folder, 'mhd/unlesbar.png')
    await writePhoto(folder, 'verpackung/dose.png')
  })

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true })
  })

  it('misst alle Rollen mit Fake-KI und schreibt Markdown und JSON nach berichte/', async () => {
    const result = await measureRecognition(optionsFor(folder), deps)
    expect(result.ok).toBe(true)
    expect(lines[0]).toContain('Trockenlauf')
    const files = await readdir(join(folder, 'berichte'))
    expect(files.sort()).toEqual([
      'bericht-2026-11-23T10-00-00.json',
      'bericht-2026-11-23T10-00-00.md',
    ])
    const markdown = await readFile(join(folder, 'berichte', files[1] ?? ''), 'utf8')
    // Fake meldet „nichts erkannt“: Beim unlesbaren MHD ist das richtig, bei der Dose leer.
    expect(markdown).toContain('| claude-haiku-5-5 | 100\u00a0% | 1/1 |')
    expect(markdown).toContain(
      '| claude-haiku-5-5 | verpackung/dose.png | behaelter | leer | dose | – |',
    )
  })

  it('misst nur die gewählten Rollen', async () => {
    await measureRecognition(optionsFor(folder, ['--rollen', 'verpackung']), deps)
    expect(lines.filter((line) => line.startsWith('mhd ·'))).toEqual([])
  })

  it('bricht ohne ANTHROPIC_API_KEY ab, bevor ein Foto gelesen wird', async () => {
    const result = await measureRecognition(optionsFor(folder), { ...deps, envSource: {} })
    expect(!result.ok && result.error).toContain('ANTHROPIC_API_KEY fehlt')
    // Eine leere Zeile aus .env.example ist kein Trockenlauf, sondern „nicht gesetzt“
    const empty = await measureRecognition(optionsFor(folder), {
      ...deps,
      envSource: { AI_PROVIDER: '', ANTHROPIC_API_KEY: '' },
    })
    expect(!empty.ok && empty.error).toContain('ANTHROPIC_API_KEY fehlt')
    const invalid = await measureRecognition(optionsFor(folder), {
      ...deps,
      envSource: { AI_PROVIDER: 'openai' },
    })
    expect(!invalid.ok && invalid.error).toContain('AI_PROVIDER')
    await expect(readdir(join(folder, 'berichte'))).rejects.toThrow()
  })

  it('meldet fehlende Erwartungen, fehlende Fotos und Rollen ohne Fotos', async () => {
    const missingPhoto = {
      fotos: [{ datei: 'fehlt.jpg', rolle: 'mhd', erwartet: { datum: null } }],
    }
    await writeFile(join(folder, 'erwartungen.json'), JSON.stringify(missingPhoto))
    const noPhoto = await measureRecognition(optionsFor(folder), deps)
    expect(!noPhoto.ok && noPhoto.error).toContain('Foto fehlt')
    const noRole = await measureRecognition(optionsFor(folder, ['--rollen', 'naehrwerte']), deps)
    expect(!noRole.ok && noRole.error).toContain('keine Fotos eingetragen')
    await writeFile(join(folder, 'erwartungen.json'), '{')
    const broken = await measureRecognition(optionsFor(folder), deps)
    expect(!broken.ok && broken.error).toContain('kein gültiges JSON')
    await rm(join(folder, 'erwartungen.json'))
    const missing = await measureRecognition(optionsFor(folder), deps)
    expect(!missing.ok && missing.error).toContain('erwartungen.json fehlt')
  })
})

describe('runPoc · Standard-Strategie', () => {
  const expectations = parseExpectations({
    fotos: [{ datei: 'a.jpg', rolle: 'mhd', erwartet: { datum: '2028-03' } }],
  })

  it('nutzt den Zweitversuch der App und hält beide Aufrufe fest', async () => {
    if (!expectations.ok) throw new Error(expectations.error)
    const unsure = { roh_text: null, datum: null, genauigkeit: 'unbekannt', art: 'unbekannt' }
    const read = { roh_text: '03/2028', datum: '2028-03-01', genauigkeit: 'monat', art: 'mhd' }
    const recognizer = createFakeVisionRecognizer([
      { role: 'mhd', answer: { ...unsure, sicherheit: 'niedrig' } },
      { role: 'mhd_zweitversuch', answer: { ...read, sicherheit: 'hoch' } },
    ])
    const runs = await runPoc(
      { recognizer, images: imagesFor(expectations.value), foodTypes: [] },
      {
        expectations: expectations.value,
        variants: planVariants({
          roles: ['mhd'],
          modelsByRole: { verpackung: [], naehrwerte: [], mhd: ['claude-haiku-5-5'] },
          withStandard: true,
        }),
      },
    )
    expect(runs.map((run) => [run.calls.length, run.fields[0]?.outcome])).toEqual([
      [1, 'leer'],
      [2, 'treffer'],
    ])
  })
})

function imagesFor(expectations: Expectations) {
  const image = { data: new Uint8Array([1, 2, 3]), mimeType: 'image/jpeg' as const }
  return new Map(expectations.fotos.map((photo) => [photo.datei, image]))
}
