// Deutsche Bezeichnungen der Seite „Foto-Erkennung“ (#108, #79), an einer Stelle.
import type { AiRole } from '@/shared/config/ai-roles'
import type { AI_CONNECTION_STATUSES } from '@/shared/config/constants'
import { formatGermanDateTime } from '@/shared/lib/date-time'
import type { AiSetupStatus } from '../domain/ai-status'

export const ROLE_LABELS: Record<AiRole, string> = {
  verpackung: 'Verpackung',
  naehrwerte: 'Nährwerttabelle',
  naehrwerte_schaetzen: 'Nährwerte schätzen',
  mhd: 'MHD',
  mhd_zweitversuch: 'MHD, zweiter Versuch',
  mhd_schaetzen: 'MHD schätzen',
}

export const ROLE_HINTS: Partial<Record<AiRole, string>> = {
  naehrwerte_schaetzen: 'Nur auf Wunsch, wenn es keine Nährwerttabelle gibt.',
  mhd_zweitversuch: 'Läuft nur, wenn das Datum beim ersten Versuch unsicher ist.',
  mhd_schaetzen: 'Nur auf Wunsch, wenn kein Datum aufgedruckt ist.',
}

const MODEL_LABELS: Readonly<Record<string, string>> = {
  'claude-haiku-5-5': 'Haiku 5.5',
  'claude-sonnet-5-5': 'Sonnet 5.5',
  'claude-opus-5-5': 'Opus 5.5',
}

/** „Haiku 5.5“ für bekannte Modelle, sonst die Modell-ID selbst */
export const modelLabel = (model: string): string => MODEL_LABELS[model] ?? model

type Tone = 'green' | 'orange' | 'red' | 'neutral'

export const SETUP_STATUS: Record<AiSetupStatus, { label: string; tone: Tone }> = {
  ready: { label: 'eingerichtet', tone: 'green' },
  disabled: { label: 'aus', tone: 'neutral' },
  'not-configured': { label: 'nicht eingerichtet', tone: 'orange' },
  'test-failed': { label: 'Fehler beim letzten Test', tone: 'red' },
}

type TestStatus = (typeof AI_CONNECTION_STATUSES)[number]

export const TEST_STATUS_LABELS: Record<TestStatus, string> = {
  ok: 'funktioniert',
  schluessel_ungueltig: 'Schlüssel ungültig',
  kein_guthaben: 'kein Guthaben',
  zeitueberschreitung: 'Zeitüberschreitung',
  fehler: 'Fehler',
}

export const formatTestTime = formatGermanDateTime

export const ENV_CONNECTION_LABELS = {
  anthropic: 'Anthropic · aus Umgebungsvariable',
  fake: 'Test-Anbieter ohne Netz',
} as const
