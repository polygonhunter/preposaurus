// Meldungen von Better Auth, die im Betrieb von Preposaurus nichts bedeuten (#218).
//
// „Base URL is not set“: Preposaurus kennt seine Adresse bewusst nicht. Dasselbe NAS ist je nach
// Weg unter mehreren Namen erreichbar (Tailscale-Name, IP im WLAN, localhost). Better Auth leitet
// den Ursprung dann aus der Anfrage ab, genau das ist gewollt: Eine feste baseURL würde Anmeldungen
// über die anderen Namen als fremden Ursprung abweisen. Die Warnung nennt Rückrufe und
// Weiterleitungen, die es hier nicht gibt (kein OAuth, keine Mail-Links von Better Auth, die
// Anmeldung läuft über auth.api in Server Actions). APP_URL bleibt allein für Links in Mails.
//
// Sicherheit ohne baseURL (geprüft mit Better Auth 1.7, Review #235): Die HTTP-Routen von Better
// Auth beantworten jeden Pfad mit 404 (http-allow-list.ts, leere Liste). Für Aufrufe über auth.api
// ohne Request überspringt Better Auth seine Origin-Prüfung ohnehin. Den CSRF-Schutz liefert
// Next.js: Server Actions laufen nur, wenn der Origin-Header zu Host bzw. X-Forwarded-Host passt.
// Die Sitzungs-Cookies sind SameSite=Lax. Kommt je eine HTTP-Route dazu, braucht sie eine
// dynamische baseURL mit allowedHosts oder trustedOrigins, bevor diese Warnung weichen darf.
const IGNORED_WARNINGS = ['Base URL is not set'] as const

/** Gehört die Meldung zu den bekannten, im Betrieb bedeutungslosen Warnungen? */
export function isIgnoredAuthWarning(message: string): boolean {
  return IGNORED_WARNINGS.some((warning) => message.includes(warning))
}
