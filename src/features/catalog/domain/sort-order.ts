// Reihenfolge eigener Stammdaten (EIN-04): Ein Eintrag rückt je Tipp eine Stelle nach oben oder
// unten. Gespeichert wird danach die ganze Liste neu durchnummeriert, so gibt es keine Lücken und
// keine doppelten Plätze (ältere Einträge haben alle die Sortierung 0).

export type MoveDirection = 'up' | 'down'

/** Neue Reihenfolge der IDs, oder null, wenn der Eintrag fehlt oder schon am Rand steht. */
export function moveInOrder(
  ids: readonly string[],
  id: string,
  direction: MoveDirection,
): string[] | null {
  const from = ids.indexOf(id)
  const to = direction === 'up' ? from - 1 : from + 1
  if (from === -1 || to < 0 || to >= ids.length) return null
  const reordered = [...ids]
  reordered.splice(from, 1)
  reordered.splice(to, 0, id)
  return reordered
}
