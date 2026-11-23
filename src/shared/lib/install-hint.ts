// Hinweis „Zum Home-Bildschirm“ (M10-03, #83): Nur im Safari auf dem iPhone, nicht in der schon
// installierten App, und nicht mehr, wenn man ihn einmal ausgeblendet hat. Reine Regeln, testbar.

/** Schlüssel im localStorage des Geräts, Wert „1“ heißt ausgeblendet. */
export const INSTALL_HINT_DISMISSED_KEY = 'preposaurus.hinweis-home-bildschirm'

/** Überschrift und Satz des Hinweises, auf der Übersicht und im Schritt der Einrichtung (#40) */
export const INSTALL_HINT_TITLE = 'Als App auf den Home-Bildschirm'
export const INSTALL_HINT_TEXT =
  'Tippt in Safari auf „Teilen“ und dann auf „Zum Home-Bildschirm“. Dann startet Preposaurus wie eine App, und Erinnerungen per Push sind möglich.'

const IPHONE = /\b(iPhone|iPod)\b/
// Chrome, Firefox, Edge, Opera, Google-App, DuckDuckGo: eigene Browser auf iOS mit anderem Menü
const OTHER_IOS_BROWSER = /\b(CriOS|FxiOS|EdgiOS|OPiOS|OPT|GSA|DuckDuckGo|YaBrowser)\//
// Eingebettete Webansichten (Mail, Messenger) melden kein „Safari/“ und können nichts installieren.
const SAFARI = /\bVersion\/[\d.]+.*\bSafari\//

function isIphoneSafari(userAgent: string): boolean {
  return IPHONE.test(userAgent) && SAFARI.test(userAgent) && !OTHER_IOS_BROWSER.test(userAgent)
}

export type InstallHintFacts = Readonly<{
  userAgent: string
  /** display-mode: standalone oder navigator.standalone (iOS) */
  isStandalone: boolean
  isDismissed: boolean
}>

export function shouldShowInstallHint({
  userAgent,
  isStandalone,
  isDismissed,
}: InstallHintFacts): boolean {
  return isIphoneSafari(userAgent) && !isStandalone && !isDismissed
}
