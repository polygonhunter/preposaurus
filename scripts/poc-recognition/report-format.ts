// Zahlen- und Tabellenformat des Berichts, deutsch.
const percent = new Intl.NumberFormat('de-DE', { style: 'percent', maximumFractionDigits: 1 })
const seconds = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 })
const dollars = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 4 })
const integer = new Intl.NumberFormat('de-DE')

const MS_PER_SECOND = 1000

export const formatPercent = (rate: number | null) => (rate === null ? '–' : percent.format(rate))

export const formatSeconds = (ms: number) => `${seconds.format(ms / MS_PER_SECOND)} s`

export const formatUsd = (usd: number | null) =>
  usd === null ? 'unbekannt' : `${dollars.format(usd)} $`

export const formatCount = (count: number) => integer.format(count)

export const formatRatio = (part: number, total: number) =>
  `${formatCount(part)}/${formatCount(total)}`

const escapeCell = (text: string) => text.replaceAll('|', '\\|').replaceAll('\n', ' ')

export function table(header: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (cells: readonly string[]) => `| ${cells.map(escapeCell).join(' | ')} |`
  return [line(header), line(header.map(() => '---')), ...rows.map(line)].join('\n')
}
