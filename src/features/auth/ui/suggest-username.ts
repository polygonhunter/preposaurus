// Vorschlag für den Benutzernamen aus dem Anzeigenamen (ONBOARDING §2.2, „Alex Beispiel“ → alex):
// das erste Wort, klein, Umlaute ausgeschrieben, Akzente weg, nur erlaubte Zeichen. Passt das
// Ergebnis nicht zum Schema (z. B. zu kurz), gibt es keinen Vorschlag. Nur eine Vorbelegung im
// Formular, geprüft wird der Name wie jeder andere in der Action.
import { USERNAME_MAX_LENGTH } from '@/shared/config/constants'
import { usernameSchema } from '../schemas'

const SPELLED_OUT: Readonly<Record<string, string>> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' }

const spellOutUmlauts = (text: string) =>
  text.replace(/[äöüß]/g, (letter) => SPELLED_OUT[letter] ?? '')

const withoutAccents = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '')

export function suggestUsername(displayName: string): string {
  const [firstWord = ''] = displayName.normalize('NFC').trim().split(/\s+/)
  const candidate = withoutAccents(spellOutUmlauts(firstWord.toLowerCase()))
    .replace(/[^a-z0-9._]/g, '')
    .replace(/^[._]+/, '')
    .slice(0, USERNAME_MAX_LENGTH)
  return usernameSchema.safeParse(candidate).success ? candidate : ''
}
