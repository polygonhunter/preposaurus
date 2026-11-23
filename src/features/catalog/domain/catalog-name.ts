// Namen eigener Stammdaten (Lagerorte, Kategorien, Lebensmittelarten) sind je Haushalt eindeutig.
// Die DB prüft nur die genaue Schreibweise, die App zusätzlich ohne Groß- und Kleinschreibung,
// damit „Keller“ und „keller“ nicht nebeneinander stehen.

export interface NamedEntry {
  id: string
  name: string
  isHidden: boolean
}

const comparable = (name: string) => name.trim().toLocaleLowerCase('de')

/** Eintrag, der schon so heißt (ausgeblendete zählen mit), ohne den Eintrag selbst. */
export function findNameConflict<T extends NamedEntry>(
  entries: readonly T[],
  name: string,
  exceptId: string | null,
): T | null {
  const wanted = comparable(name)
  return entries.find((entry) => entry.id !== exceptId && comparable(entry.name) === wanted) ?? null
}
