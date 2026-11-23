// Beispiele bei „Fehlt bis zum Ziel“ (UX-Konzept §8.6, #202): je Warengruppe ein paar
// Lebensmittelarten, damit „3,5 kg Getreide“ greifbar wird („z. B. Nudeln, Reis“). Die Auswahl
// steht nur hier: zuerst Arten, die der Haushalt schon im Vorrat hat, dann die Reihenfolge des
// Katalogs.

/** So viele Beispiele stehen höchstens an einer Lücke. */
const GAP_EXAMPLE_COUNT = 2

/** Eine Lebensmittelart, die der Haushalt nutzen kann, in der Reihenfolge des Katalogs. */
export interface GroupFoodType {
  groupKey: string
  name: string
  /** Der Haushalt hat davon gerade etwas im Vorrat */
  isStocked: boolean
}

/** Bis zu zwei Beispiele für eine Warengruppe, Bekanntes zuerst. */
export function pickGapExamples(foodTypes: readonly GroupFoodType[], groupKey: string): string[] {
  const inGroup = foodTypes.filter((foodType) => foodType.groupKey === groupKey)
  const ordered = [
    ...inGroup.filter((foodType) => foodType.isStocked),
    ...inGroup.filter((foodType) => !foodType.isStocked),
  ]
  return [...new Set(ordered.map(({ name }) => name))].slice(0, GAP_EXAMPLE_COUNT)
}
