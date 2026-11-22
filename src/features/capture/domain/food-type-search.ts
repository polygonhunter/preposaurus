// Suche nach der Lebensmittelart beim Erfassen (UX §8.5 „Lebensmittelart wählen“). Treffer im
// Namen zählen vor Treffern im Pfad (Kategorie, Warengruppe), damit „nudel“ zuerst „Nudeln“ zeigt.
// Groß- und Kleinschreibung, Umlaute und ß spielen keine Rolle („apfel“ findet „Äpfel“).

interface SearchableFoodType {
  name: string
  categoryName: string
  productGroupName: string
}

const NO_MATCH = Number.POSITIVE_INFINITY

/** Kleinschreibung ohne Akzente, ß als ss. „Äpfel“ wird zu „apfel“. */
export function normalizeSearchText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replaceAll('ß', 'ss')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

const wordsOf = (text: string) => text.split(/[\s,()/-]+/)

/** Kleinerer Rang = besserer Treffer. */
function rankOf(foodType: SearchableFoodType, query: string): number {
  const name = normalizeSearchText(foodType.name)
  if (name.startsWith(query)) return 0
  if (wordsOf(name).some((word) => word.startsWith(query))) return 1
  if (name.includes(query)) return 2
  const path = normalizeSearchText(`${foodType.categoryName} ${foodType.productGroupName}`)
  return path.includes(query) ? 3 : NO_MATCH
}

/** Treffer nach Rang, bei gleichem Rang in der Reihenfolge der Liste. Leere Suche: keine Treffer. */
export function searchFoodTypes<T extends SearchableFoodType>(
  foodTypes: readonly T[],
  query: string,
  limit: number,
): T[] {
  const normalized = normalizeSearchText(query)
  if (normalized === '') return []
  return foodTypes
    .map((foodType, index) => ({ foodType, index, rank: rankOf(foodType, normalized) }))
    .filter((entry) => entry.rank !== NO_MATCH)
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .slice(0, limit)
    .map((entry) => entry.foodType)
}
