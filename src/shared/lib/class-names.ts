type ClassValue = string | false | null | undefined

// Fügt CSS-Klassen zusammen und lässt leere Bedingungen weg: cx('a', isOn && 'b').
export function cx(...classes: readonly ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
