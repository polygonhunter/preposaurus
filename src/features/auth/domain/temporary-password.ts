// Vorläufiges Passwort für das Zurücksetzen per Kommandozeile (EINSTELLUNGEN_NUTZER §3.4).
// Bis die Wortliste aus §3.2 kommt: fünf Gruppen aus je vier Zeichen, ohne leicht verwechselbare
// Zeichen (0/o, 1/l/i), zusammen rund 99 Bit. Der Zufall kommt von außen (kryptografisch), damit
// die Regel ohne Zufall testbar bleibt.

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const GROUPS = 5
const GROUP_LENGTH = 4
const SEPARATOR = '-'

/** Liefert eine zufällige ganze Zahl von 0 bis size - 1. */
export type RandomIndex = (size: number) => number

function randomGroup(randomIndex: RandomIndex): string {
  return Array.from({ length: GROUP_LENGTH }, () =>
    ALPHABET.charAt(randomIndex(ALPHABET.length)),
  ).join('')
}

export function generateTemporaryPassword(randomIndex: RandomIndex): string {
  return Array.from({ length: GROUPS }, () => randomGroup(randomIndex)).join(SEPARATOR)
}
