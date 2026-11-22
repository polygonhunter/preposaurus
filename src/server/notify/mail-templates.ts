// Deutsche Vorlagen für Wochenübersicht und Check-in-Mail (ERI-02, ERI-06). Ton ruhig und
// freundlich, keine Angstmache (CLAUDE.md). Die Zeilen der Wochenübersicht baut die Fachlogik
// der Erinnerungen, hier steht nur der Rahmen.
import { renderMail, type MailLink } from './mail-layout'
import type { MailContent } from './mail-sender'

const MAX_NAMES = 5

const overviewLink = (appUrl: string | null): MailLink | null =>
  appUrl === null ? null : { url: appUrl, label: 'Vorrat öffnen' }

interface WeeklySummaryMailInput {
  lines: readonly string[]
  appUrl: string | null
}

export function weeklySummaryMail({ lines, appUrl }: WeeklySummaryMailInput): MailContent {
  return renderMail({
    subject: 'Eure Wochenübersicht',
    heading: 'Wochenübersicht',
    lines,
    link: overviewLink(appUrl),
  })
}

/** „Mais, Reis und Linsen“, ab sechs Namen „… und 3 weitere“. */
export function listNames(names: readonly string[]): string {
  const unique = [...new Set(names)]
  const shown = unique.slice(0, MAX_NAMES)
  const rest = unique.length - shown.length
  const parts = rest > 0 ? [...shown, `${String(rest)} weitere`] : shown
  if (parts.length <= 1) return parts.join('')
  return `${parts.slice(0, -1).join(', ')} und ${parts.at(-1) ?? ''}`
}

interface CheckInMailInput {
  /** Namen abgelaufener Einträge, früheste zuerst */
  expired: readonly string[]
  /** Namen bald fälliger Einträge, früheste zuerst */
  dueSoon: readonly string[]
  appUrl: string | null
}

function checkInLines({ expired, dueSoon }: CheckInMailInput): string[] {
  const lines = ['Wie sieht’s aus? Zeit für einen kurzen Blick in den Vorrat.']
  if (expired.length > 0)
    lines.push(`Abgelaufen: ${listNames(expired)}. Kurz ansehen und entscheiden.`)
  if (dueSoon.length > 0) lines.push(`Bald fällig: ${listNames(dueSoon)}.`)
  if (expired.length === 0 && dueSoon.length === 0) {
    lines.push('Gerade ist nichts fällig. Euer Vorrat ist gut in Schuss.')
  }
  return lines
}

export function checkInMail(input: CheckInMailInput): MailContent {
  return renderMail({
    subject: 'Zeit für einen Blick in den Vorrat',
    heading: 'Kurzer Vorrats-Check',
    lines: checkInLines(input),
    link: overviewLink(input.appUrl),
  })
}
