// Suche nach der Lebensmittelart beim Erfassen (UX §8.5 „Lebensmittelart wählen“, #212).
// Reihenfolge: genauer Name oder genaues Suchwort, Namensanfang, Wortanfang im Namen, Suchwort
// (Sorte, Alltagsname, z. B. „Spaghetti“ → Nudeln), Teilwort, zuletzt Kategorie und Warengruppe.
// Bei gleichem Rang zuerst zuletzt genutzte Arten, dann die Reihenfolge der Liste. Groß- und
// Kleinschreibung, Umlaute (auch als ae, oe, ue) und ß spielen keine Rolle. Kurze Eingaben (unter
// drei Zeichen) treffen nur Wortanfänge, damit „Öl“ nicht „Brokkoli“ findet. Mehrere Wörter
// treffen auch einzeln („tomaten dose“).
import { normalizeSearchText } from '@/shared/lib/search-text'
import { FOOD_TYPE_SEARCH_TERMS } from './food-type-search-terms'

interface SearchableFoodType {
  id: string
  key: string
  name: string
  categoryName: string
  productGroupName: string
  /** Eigene Suchwörter einer eigenen Art (#126), zusätzlich zu FOOD_TYPE_SEARCH_TERMS */
  searchTerms?: readonly string[]
}

const NO_MATCH = Number.POSITIVE_INFINITY
const MIN_INFIX_LENGTH = 3

const RANK = {
  exact: 0,
  namePrefix: 1,
  nameWord: 2,
  searchTerm: 3,
  infix: 4,
  path: 5,
} as const

const wordsOf = (text: string) => text.split(/[\s,()/:-]+/)

const hasWordStartingWith = (texts: readonly string[], query: string) =>
  texts.some((text) => wordsOf(text).some((word) => word.startsWith(query)))

/** Rang über die Suchwörter der Art, ohne Treffer NO_MATCH. */
function searchTermRank(terms: readonly string[], query: string): number {
  if (terms.includes(query)) return RANK.exact
  if (terms.some((term) => term.startsWith(query)) || hasWordStartingWith(terms, query)) {
    return RANK.searchTerm
  }
  return NO_MATCH
}

/** Teilwort in Name oder Suchwort (ab drei Zeichen), sonst Kategorie und Warengruppe. */
function looseRank(texts: readonly string[], path: string, query: string): number {
  const isLongEnough = query.length >= MIN_INFIX_LENGTH
  if (isLongEnough && texts.some((text) => text.includes(query))) return RANK.infix
  if (hasWordStartingWith([path], query) || (isLongEnough && path.includes(query))) {
    return RANK.path
  }
  return NO_MATCH
}

/** Kleinerer Rang = besserer Treffer. */
function rankOf(foodType: SearchableFoodType, query: string): number {
  const name = normalizeSearchText(foodType.name)
  const terms = [
    ...(FOOD_TYPE_SEARCH_TERMS[foodType.key] ?? []),
    ...(foodType.searchTerms ?? []),
  ].map(normalizeSearchText)
  if (name === query) return RANK.exact
  const byTerm = searchTermRank(terms, query)
  if (byTerm === RANK.exact) return RANK.exact
  if (name.startsWith(query)) return RANK.namePrefix
  if (hasWordStartingWith([name], query)) return RANK.nameWord
  if (byTerm !== NO_MATCH) return byTerm
  const path = normalizeSearchText(`${foodType.categoryName} ${foodType.productGroupName}`)
  return looseRank([name, ...terms], path, query)
}

/** Mehrere Wörter („erbsen möhren“): als Ganzes, sonst muss jedes Wort für sich treffen. */
function queryRankOf(foodType: SearchableFoodType, query: string): number {
  const whole = rankOf(foodType, query)
  const words = query.split(/\s+/)
  if (whole !== NO_MATCH || words.length === 1) return whole
  return Math.max(...words.map((word) => rankOf(foodType, word)))
}

interface SearchOptions {
  /** Zuletzt genutzte Arten, neueste zuerst: Sie stehen bei gleichem Rang vorn. */
  recentIds?: readonly string[]
}

/** Alle Treffer nach Rang. Leere Suche: keine Treffer. Kürzen ist Sache der Anzeige. */
export function searchFoodTypes<T extends SearchableFoodType>(
  foodTypes: readonly T[],
  query: string,
  { recentIds = [] }: SearchOptions = {},
): T[] {
  const normalized = normalizeSearchText(query)
  if (normalized === '') return []
  const recency = (id: string) => {
    const index = recentIds.indexOf(id)
    return index === -1 ? recentIds.length : index
  }
  return foodTypes
    .map((foodType, index) => ({ foodType, index, rank: queryRankOf(foodType, normalized) }))
    .filter((entry) => entry.rank !== NO_MATCH)
    .sort(
      (a, b) =>
        a.rank - b.rank || recency(a.foodType.id) - recency(b.foodType.id) || a.index - b.index,
    )
    .map((entry) => entry.foodType)
}
