// Inhaltsregeln für neue Passwörter (EINSTELLUNGEN_NUTZER §4.4). Die Länge prüft das Zod-Schema,
// hier steht nur, was ein Passwort nicht enthalten darf: Benutzername, Haushaltsname und den
// Namen der App, auch als Teil mit Anhängsel („preposaurus2026“). Verglichen wird ohne Groß- und
// Kleinschreibung und ohne Leer- und Satzzeichen, damit „Unser Haushalt“ auch „unserhaushalt“ trifft.

export type PasswordProblem = 'contains-username' | 'contains-household-name' | 'contains-app-name'

export type PasswordContext = Readonly<{ username: string; householdName?: string | undefined }>

const APP_NAME = 'preposaurus'
// Kürzere Namen kommen in fast jedem Passwort zufällig vor und würden zu viel ablehnen.
const MIN_COMPARABLE_LENGTH = 3

const comparable = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')

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
  if (contains(password, context.username)) return 'contains-username'
  if (contains(password, context.householdName)) return 'contains-household-name'
  return null
}
