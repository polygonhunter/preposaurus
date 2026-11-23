import { describe, expect, it } from 'vitest'
import type { FieldResult } from './compare-values'
import { renderMarkdown } from './report-markdown'
import type { PhotoRun } from './run-recognition'
import { summarize } from './summarize'
import { buildJsonReport } from './write-report'

const call = (model: string, inputTokens: number | null = 1_000, outputTokens = 100) => ({
  role: 'mhd' as const,
  model,
  durationMs: 1_500,
  inputTokens,
  outputTokens,
})

const date = (outcome: FieldResult['outcome'], expected: string, actual: string): FieldResult => ({
  field: 'datum',
  outcome,
  expected,
  actual,
})

const RUNS: PhotoRun[] = [
  {
    photo: 'mhd/ok.jpg',
    role: 'mhd',
    variant: 'claude-haiku-5-5',
    calls: [call('claude-haiku-5-5')],
    failure: null,
    fields: [date('treffer', '2028-03-14', '2028-03-14 (Tag)')],
  },
  {
    photo: 'mhd/unlesbar.jpg',
    role: 'mhd',
    variant: 'claude-haiku-5-5',
    calls: [call('claude-haiku-5-5')],
    failure: null,
    fields: [date('erfunden', '–', '2027-05-01 (Tag)')],
  },
  {
    photo: 'mhd/ok.jpg',
    role: 'mhd',
    variant: 'Standard',
    calls: [call('claude-haiku-5-5'), call('claude-sonnet-5-5')],
    failure: null,
    fields: [date('leer', '2028-03-14', '–')],
  },
  {
    photo: 'mhd/unlesbar.jpg',
    role: 'mhd',
    variant: 'Standard',
    calls: [call('claude-haiku-5-5', null)],
    failure: 'timeout',
    fields: [date('fehler', '–', '–')],
  },
]

describe('summarize', () => {
  const [haiku, standard] = summarize(RUNS)

  it('fasst je Rolle und Variante zusammen, in der Reihenfolge der Läufe', () => {
    expect(summarize(RUNS).map((summary) => summary.variant)).toEqual([
      'claude-haiku-5-5',
      'Standard',
    ])
  })

  it('zählt Treffer, erfundene MHDs mit Foto-Namen und Kosten aus den Tokens', () => {
    expect(haiku).toMatchObject({
      photos: 2,
      fieldsScored: 2,
      hits: 1,
      hitRate: 0.5,
      photosAllCorrect: 1,
      inventedDates: [{ photo: 'mhd/unlesbar.jpg', expected: '–', actual: '2027-05-01 (Tag)' }],
      durationMs: 3_000,
      inputTokens: 2_000,
      outputTokens: 200,
    })
    // Haiku 5.5: 0,10 $ ein und 0,50 $ aus je Million Tokens
    expect(haiku?.costUsd).toBeCloseTo(0.0003, 8)
  })

  it('zählt Zweitversuche, leere Felder und Fehler; ein Aufruf ohne Tokens fehlt nur in den Kosten', () => {
    expect(standard).toMatchObject({
      secondAttempts: 1,
      emptyFields: 1,
      failedPhotos: 1,
      hits: 0,
      inventedDates: [],
      callsWithoutUsage: 1,
      pricedPhotos: 1,
    })
    // Haiku (0,0001 + 0,00005) und Sonnet (0,002 + 0,001) für das erste Foto, der Zeitlimit-Aufruf fehlt
    expect(standard?.costUsd).toBeCloseTo(0.00315, 8)
    expect(standard?.perField['datum']).toEqual({ hits: 0, total: 2, empty: 1 })
  })
})

describe('Bericht', () => {
  const meta = {
    createdAt: new Date('2026-11-23T10:00:00Z'),
    folder: 'poc',
    isDryRun: false,
    tolerance: { relativ: 0.05, absolut: 0.5 },
  }
  const markdown = renderMarkdown(meta, summarize(RUNS), RUNS)

  it('zeigt je Variante Trefferquote, erfundene MHDs, Zweitversuche und Kosten', () => {
    expect(markdown).toContain('## MHD (2 Fotos)')
    expect(markdown).toContain('| claude-haiku-5-5 | 50\u00a0% | 1/2 | 0 | 0 | 1 | 0/2 | 1,5 s |')
    expect(markdown).toContain('| Standard | 0\u00a0% | 0/2 | 1 | 1 | 0 | 1/2 |')
    expect(markdown).toContain('0,0032 $ (ohne 1 Aufruf(e) ohne Tokens) | 0,0032 $ |')
    const unknownModel = RUNS.map((run) => ({ ...run, calls: [call('claude-neu-1')] }))
    expect(renderMarkdown(meta, summarize(unknownModel), unknownModel)).toContain('unbekannt')
  })

  it('führt jedes erfundene MHD mit Foto-Namen auf', () => {
    expect(markdown).toContain(
      '- **claude-haiku-5-5:** 1\n  - `mhd/unlesbar.jpg`: aufgedruckt –, gemeldet 2027-05-01 (Tag)',
    )
    expect(markdown).toContain('- **Standard:** keine')
  })

  it('listet Abweichungen samt Fehlerart und kennzeichnet einen Trockenlauf', () => {
    expect(markdown).toContain('| Standard | mhd/unlesbar.jpg | datum | fehler (timeout) | – | – |')
    expect(markdown).not.toContain('Trockenlauf')
    expect(renderMarkdown({ ...meta, isDryRun: true }, [], [])).toContain('Trockenlauf')
  })

  it('schreibt dieselben Zahlen als JSON, ohne Bilddaten', () => {
    const json = JSON.parse(buildJsonReport({ meta, summaries: summarize(RUNS), runs: RUNS })) as {
      varianten: { hits: number }[]
      laeufe: unknown[]
    }
    expect(json.varianten.map((variant) => variant.hits)).toEqual([1, 0])
    expect(json.laeufe).toHaveLength(4)
  })
})
