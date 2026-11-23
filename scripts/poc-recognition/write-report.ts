// Schreibt den Bericht als Markdown und JSON nach <ordner>/berichte/ (git-ignoriert wie poc/).
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { renderMarkdown, type ReportMeta } from './report-markdown'
import type { PhotoRun } from './run-recognition'
import type { VariantSummary } from './summarize'

export interface ReportInput {
  meta: ReportMeta
  summaries: readonly VariantSummary[]
  runs: readonly PhotoRun[]
}

export function buildJsonReport({ meta, summaries, runs }: ReportInput): string {
  const report = {
    erstelltAm: meta.createdAt.toISOString(),
    ordner: meta.folder,
    trockenlauf: meta.isDryRun,
    toleranz: meta.tolerance,
    varianten: summaries,
    laeufe: runs,
  }
  return `${JSON.stringify(report, null, 2)}\n`
}

/** Zeitstempel ohne Doppelpunkte, damit der Dateiname überall gültig ist. */
const fileStamp = (date: Date) => date.toISOString().slice(0, 19).replaceAll(':', '-')

export async function writeReport(input: ReportInput): Promise<{ markdown: string; json: string }> {
  const folder = join(input.meta.folder, 'berichte')
  await mkdir(folder, { recursive: true })
  const base = join(folder, `bericht-${fileStamp(input.meta.createdAt)}`)
  const paths = { markdown: `${base}.md`, json: `${base}.json` }
  await writeFile(paths.markdown, renderMarkdown(input.meta, input.summaries, input.runs))
  await writeFile(paths.json, buildJsonReport(input))
  return paths
}
