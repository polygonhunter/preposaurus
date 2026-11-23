// Foto-Rollen der KI und ihre empfohlenen Standardmodelle (Issue #108). Einzige Stelle dafür:
// Das DB-Schema (CHECK in ki_rollen_zuweisung), der Konfigurations-Service (ohne Zuweisung gilt die
// Empfehlung), der spätere Seed und die Oberfläche lesen von hier. Liegt in shared/config statt in einer domain/, weil das Schema die Werte braucht und
// server/ aus domain/ nur Typen importieren darf (CODE_PRINZIPIEN §2).
export const AI_ROLES = [
  'verpackung',
  'naehrwerte',
  'naehrwerte_schaetzen',
  'mhd',
  'mhd_zweitversuch',
  // MHD schätzen bei „Datum fehlt“, nur auf ausdrückliche Wahl (#124)
  'mhd_schaetzen',
] as const

export type AiRole = (typeof AI_ROLES)[number]

const HAIKU = 'claude-haiku-5-5'
const SONNET = 'claude-sonnet-5-5'
const OPUS = 'claude-opus-5-5'

// Modelle zur Auswahl je Rolle in den Einstellungen (#108), günstigstes zuerst. Ein anderes Modell
// in einer Zuweisung bleibt gültig und wird zusätzlich angeboten.
export const AI_MODEL_CHOICES = [HAIKU, SONNET, OPUS] as const

// Rollen, die sich einzeln abschalten lassen, ohne dass die Erkennung ausfällt: der Zweitversuch
// und die Schätzungen auf ausdrückliche Wahl. Verpackung, Nährwerte und MHD sind Pflicht.
export const AI_SWITCHABLE_ROLES: readonly AiRole[] = [
  'mhd_zweitversuch',
  'naehrwerte_schaetzen',
  'mhd_schaetzen',
]

// Empfehlung, keine Pflicht in der DB: Haiku überall, der Zweitversuch beim MHD mit Sonnet.
export const AI_ROLE_DEFAULT_MODELS: Readonly<Record<AiRole, string>> = {
  verpackung: HAIKU,
  naehrwerte: HAIKU,
  naehrwerte_schaetzen: HAIKU,
  mhd: HAIKU,
  mhd_zweitversuch: SONNET,
  mhd_schaetzen: HAIKU,
}
