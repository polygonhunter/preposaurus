// Meldungen von Better Auth, die im Betrieb von Preposaurus nichts bedeuten (#218).
//
// „Base URL is not set“: Preposaurus kennt seine Adresse bewusst nicht. Dasselbe NAS ist je nach
// Weg unter mehreren Namen erreichbar (Tailscale-Name, IP im WLAN, localhost). Better Auth leitet
// den Ursprung dann aus der Anfrage ab, genau das ist gewollt: Eine feste baseURL würde Anmeldungen
// über die anderen Namen als fremden Ursprung abweisen. Die Warnung nennt Rückrufe und
// Weiterleitungen, die es hier nicht gibt (kein OAuth, keine Mail-Links von Better Auth, die
// Anmeldung läuft über auth.api in Server Actions). APP_URL bleibt allein für Links in Mails.
const IGNORED_WARNINGS = ['Base URL is not set'] as const

/** Gehört die Meldung zu den bekannten, im Betrieb bedeutungslosen Warnungen? */
export function isIgnoredAuthWarning(message: string): boolean {
  return IGNORED_WARNINGS.some((warning) => message.includes(warning))
}
