// Vorschlag für den Namen der nächsten Verbindung (#108, #314): „Anthropic“, danach „Anthropic 2“
// usw. Groß- und Kleinschreibung zählt nicht, wie bei der Prüfung auf doppelte Namen.

const PROVIDER_NAME = 'Anthropic'

export function suggestConnectionName(existingNames: readonly string[]): string {
  const names = new Set(existingNames.map((name) => name.toLowerCase()))
  if (!names.has(PROVIDER_NAME.toLowerCase())) return PROVIDER_NAME
  let number = 2
  while (names.has(`${PROVIDER_NAME} ${String(number)}`.toLowerCase())) number += 1
  return `${PROVIDER_NAME} ${String(number)}`
}
