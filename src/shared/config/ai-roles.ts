// Foto-Rollen der KI und ihre empfohlenen Standardmodelle (Issue #108). Einzige Stelle dafür:
// Das DB-Schema (CHECK in ki_rollen_zuweisung), env.ts, der spätere Seed und die Oberfläche lesen
// von hier. Liegt in shared/config statt in einer domain/, weil das Schema die Werte braucht und
// server/ aus domain/ nur Typen importieren darf (CODE_PRINZIPIEN §2).
export const AI_ROLES = [
  'verpackung',
  'naehrwerte',
  'naehrwerte_schaetzen',
  'mhd',
  'mhd_zweitversuch',
] as const

export type AiRole = (typeof AI_ROLES)[number]

const HAIKU = 'claude-haiku-5-5'
const SONNET = 'claude-sonnet-5-5'

// Empfehlung, keine Pflicht in der DB: Haiku überall, der Zweitversuch beim MHD mit Sonnet.
export const AI_ROLE_DEFAULT_MODELS: Readonly<Record<AiRole, string>> = {
  verpackung: HAIKU,
  naehrwerte: HAIKU,
  naehrwerte_schaetzen: HAIKU,
  mhd: HAIKU,
  mhd_zweitversuch: SONNET,
}
