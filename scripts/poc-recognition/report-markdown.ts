// Bericht als Markdown: je Rolle eine Übersicht der Varianten, Treffer je Feld, die erfundenen
// MHDs mit Foto-Namen und alle Abweichungen. Enthält nur Dateinamen, nie Bildinhalte.
import { PHOTO_ROLES, type PhotoRole } from '../../src/shared/config/constants'
import { HIT_OUTCOMES } from './compare-values'
import {
  formatCount,
  formatPercent,
  formatRatio,
  formatSeconds,
  formatUsd,
  table,
} from './report-format'
import type { PhotoRun } from './run-recognition'
import type { VariantSummary } from './summarize'

export interface ReportMeta {
  createdAt: Date
  folder: string
  isDryRun: boolean
  tolerance: { relativ: number; absolut: number }
}

const ROLE_TITLES: Readonly<Record<PhotoRole, string>> = {
  verpackung: 'Verpackung',
  naehrwerte: 'Nährwerte',
  mhd: 'MHD',
}

function overviewRow(summary: VariantSummary): string[] {
  const isBestBefore = summary.role === 'mhd'
  return [
    summary.variant,
    formatPercent(summary.hitRate),
    formatRatio(summary.photosAllCorrect, summary.photos),
    formatCount(summary.emptyFields),
    formatCount(summary.failedPhotos),
    isBestBefore ? formatCount(summary.inventedDates.length) : '–',
    isBestBefore ? formatRatio(summary.secondAttempts, summary.photos) : '–',
    formatSeconds(summary.photos === 0 ? 0 : summary.durationMs / summary.photos),
    `${formatCount(summary.inputTokens)} / ${formatCount(summary.outputTokens)}`,
    costCell(summary),
    formatUsd(
      summary.costUsd === null || summary.pricedPhotos === 0
        ? null
        : summary.costUsd / summary.pricedPhotos,
    ),
  ]
}

/** Gescheiterte Aufrufe melden keine Tokens: Sie fehlen in der Summe, der Bericht sagt es. */
function costCell(summary: VariantSummary): string {
  const missing = summary.callsWithoutUsage
  const note = missing > 0 ? ` (ohne ${formatCount(missing)} Aufruf(e) ohne Tokens)` : ''
  return `${formatUsd(summary.costUsd)}${note}`
}

const OVERVIEW_HEADER = [
  'Variante',
  'Trefferquote',
  'Fotos ganz richtig',
  'Felder leer',
  'Fehler',
  'Erfundene MHDs',
  'Zweitversuche',
  'Ø Dauer je Foto',
  'Tokens ein / aus',
  'Kosten gesamt',
  'Kosten je Foto',
]

function fieldTable(summaries: readonly VariantSummary[]): string {
  const fields = [...new Set(summaries.flatMap((summary) => Object.keys(summary.perField)))]
  const rows = fields.map((field) => [
    field,
    ...summaries.map((summary) => {
      const tally = summary.perField[field]
      if (tally === undefined) return '–'
      const empty = tally.empty > 0 ? ` (${formatCount(tally.empty)} leer)` : ''
      return `${formatRatio(tally.hits, tally.total)}${empty}`
    }),
  ])
  return table(['Feld', ...summaries.map((summary) => summary.variant)], rows)
}

function inventedSection(summaries: readonly VariantSummary[]): string {
  const lines = summaries.map((summary) => {
    if (summary.inventedDates.length === 0) return `- **${summary.variant}:** keine`
    const items = summary.inventedDates.map(
      (date) => `  - \`${date.photo}\`: aufgedruckt ${date.expected}, gemeldet ${date.actual}`,
    )
    return [`- **${summary.variant}:** ${formatCount(items.length)}`, ...items].join('\n')
  })
  return ['### Erfundene MHDs', '', ...lines].join('\n')
}

function deviationsSection(runs: readonly PhotoRun[]): string {
  const rows = runs.flatMap((run) =>
    run.fields
      .filter((field) => !HIT_OUTCOMES.includes(field.outcome))
      .map((field) => [
        run.variant,
        run.photo,
        field.field,
        run.failure === null ? field.outcome : `${field.outcome} (${run.failure})`,
        field.expected,
        field.actual,
      ]),
  )
  if (rows.length === 0) return '### Abweichungen\n\nKeine.'
  const header = ['Variante', 'Foto', 'Feld', 'Ergebnis', 'Erwartet', 'Gemeldet']
  return `### Abweichungen\n\n${table(header, rows)}`
}

function roleSection(
  role: PhotoRole,
  summaries: readonly VariantSummary[],
  runs: readonly PhotoRun[],
): string {
  const photos = summaries[0]?.photos ?? 0
  return [
    `## ${ROLE_TITLES[role]} (${formatCount(photos)} Fotos)`,
    table(OVERVIEW_HEADER, summaries.map(overviewRow)),
    `### Treffer je Feld\n\n${fieldTable(summaries)}`,
    ...(role === 'mhd' ? [inventedSection(summaries)] : []),
    deviationsSection(runs),
  ].join('\n\n')
}

function header(meta: ReportMeta): string {
  const tolerance = `${formatPercent(meta.tolerance.relativ)}, mindestens ${formatCount(meta.tolerance.absolut)}`
  return [
    '# Messbericht Foto-Erkennung',
    ...(meta.isDryRun
      ? ['> **Trockenlauf mit Fake-KI (AI_PROVIDER=fake), keine echten Werte.**']
      : []),
    [
      `- Erstellt: ${meta.createdAt.toISOString()}`,
      `- Ordner: \`${meta.folder}\``,
      `- Toleranz für Inhalt und Nährwerte: ${tolerance}`,
      '- Treffer: richtig gelesen oder richtig „nichts lesbar“. Leer: lesbar, aber nicht erkannt.',
      '- Erfundenes MHD: ein Datum, das so nicht aufgedruckt ist (keins lesbar, anderes Datum, genauer oder ungenauer als aufgedruckt).',
      '- Kosten: Schätzung aus den Token-Zahlen und den Grundpreisen in `src/server/ai/model-prices.ts`.',
    ].join('\n'),
  ].join('\n\n')
}

export function renderMarkdown(
  meta: ReportMeta,
  summaries: readonly VariantSummary[],
  runs: readonly PhotoRun[],
): string {
  const sections = PHOTO_ROLES.flatMap((role) => {
    const forRole = summaries.filter((summary) => summary.role === role)
    if (forRole.length === 0) return []
    return [
      roleSection(
        role,
        forRole,
        runs.filter((run) => run.role === role),
      ),
    ]
  })
  return `${[header(meta), ...sections].join('\n\n')}\n`
}
