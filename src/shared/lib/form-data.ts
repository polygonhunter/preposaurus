// Liest ein Textfeld aus FormData. Fehlt das Feld oder ist es eine Datei, gilt es als leer, die
// Prüfung danach übernimmt das Zod-Schema.
export function readFormText(formData: FormData, name: string): string {
  const value = formData.get(name)
  return typeof value === 'string' ? value : ''
}

/** Erste Meldung je Feld, z. B. aus z.flattenError(…).fieldErrors */
export function firstMessages<K extends string>(
  fieldErrors: Partial<Record<K, readonly string[]>>,
): Partial<Record<K, string>> {
  const result: Partial<Record<K, string>> = {}
  for (const field of Object.keys(fieldErrors) as K[]) {
    const message = fieldErrors[field]?.[0]
    if (message !== undefined) result[field] = message
  }
  return result
}
