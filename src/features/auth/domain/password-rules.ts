// Inhaltsregeln für neue Passwörter (EINSTELLUNGEN_NUTZER §4.4). Die Länge prüft das Zod-Schema,
// hier steht nur, was ein Passwort nicht enthalten darf: Benutzername, Anzeigename, Haushaltsname
// und den Namen der App, auch als Teil mit Anhängsel („preposaurus2026“). Verglichen wird ohne Groß- und
// Kleinschreibung und ohne Leer- und Satzzeichen, damit „Unser Haushalt“ auch „unserhaushalt“ trifft.
// Dazu die mitgelieferte Liste häufiger Passwörter (#174), Herkunft in THIRD_PARTY_NOTICES.md. Sie ist
// in derselben Vergleichsform gespeichert, „Passwort123!“ trifft also „passwort123“.
import commonPasswords from './common-passwords.json'

export type PasswordProblem =
  | 'contains-username'
  | 'contains-display-name'
  | 'contains-household-name'
  | 'contains-app-name'
  | 'common-password'

export type PasswordContext = Readonly<{
  username: string
  displayName?: string | undefined
  householdName?: string | undefined
}>

const APP_NAME = 'preposaurus'
// Kürzere Namen kommen in fast jedem Passwort zufällig vor und würden zu viel ablehnen.
const MIN_COMPARABLE_LENGTH = 3

const COMMON_PASSWORDS: ReadonlySet<string> = new Set(commonPasswords)

const comparable = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

const isCommon = (password: string) => COMMON_PASSWORDS.has(comparable(password))

function contains(password: string, word: string | undefined): boolean {
  if (word === undefined) return false
  const needle = comparable(word)
  return needle.length >= MIN_COMPARABLE_LENGTH && comparable(password).includes(needle)
}

export function findPasswordProblem(
  password: string,
  context: PasswordContext,
): PasswordProblem | null {
  if (contains(password, APP_NAME)) return 'contains-app-name'
  if (isCommon(password)) return 'common-password'
  if (contains(password, context.username)) return 'contains-username'
  if (contains(password, context.displayName)) return 'contains-display-name'
  if (contains(password, context.householdName)) return 'contains-household-name'
  return null
}
