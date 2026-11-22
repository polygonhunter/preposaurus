// Gemeinsamer Rahmen aller Mails: dieselben Zeilen als Text und als schlichtes HTML ohne Bilder,
// ohne externe Inhalte und ohne Zählpixel. Jeder Text wird für HTML maskiert.
import type { MailContent } from './mail-sender'

export interface MailLink {
  url: string
  label: string
}

export interface MailLayoutInput {
  subject: string
  heading: string
  /** Jede Zeile ist ein Absatz. */
  lines: readonly string[]
  /** Link in die App, nur http(s). null: ohne Link. */
  link: MailLink | null
}

const FOOTER =
  'Diese Mail kommt von eurer eigenen Preposaurus-Installation. Ausschalten lässt sie sich in den Einstellungen unter Erinnerungen.'

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char)
}

/** Nur Links ins Web. Alles andere (javascript:, data:, kaputte Adressen) fällt weg. */
function safeLink(link: MailLink | null): MailLink | null {
  if (link === null || !URL.canParse(link.url)) return null
  const { protocol } = new URL(link.url)
  return protocol === 'https:' || protocol === 'http:' ? link : null
}

function renderText({ heading, lines }: MailLayoutInput, link: MailLink | null): string {
  const linkPart = link === null ? [] : [`${link.label}: ${link.url}`]
  return [
    heading,
    '',
    ...lines,
    ...(linkPart.length > 0 ? ['', ...linkPart] : []),
    '',
    '--',
    FOOTER,
  ]
    .join('\n')
    .concat('\n')
}

function renderHtml({ subject, heading, lines }: MailLayoutInput, link: MailLink | null): string {
  const paragraphs = lines.map((line) => `<p>${escapeHtml(line)}</p>`)
  const linkPart =
    link === null ? [] : [`<p><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></p>`]
  return [
    '<!doctype html>',
    '<html lang="de">',
    `<head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>`,
    '<body style="font-family: sans-serif; line-height: 1.5; color: #222; max-width: 36em;">',
    `<h1 style="font-size: 1.25em;">${escapeHtml(heading)}</h1>`,
    ...paragraphs,
    ...linkPart,
    `<p style="color: #555; font-size: 0.875em;">${escapeHtml(FOOTER)}</p>`,
    '</body>',
    '</html>',
  ].join('\n')
}

export function renderMail(input: MailLayoutInput): MailContent {
  const link = safeLink(input.link)
  return { subject: input.subject, text: renderText(input, link), html: renderHtml(input, link) }
}
