// Kurze Texte der Stammdaten-Seiten (EIN-04).

export function productCountLabel(count: number): string {
  if (count === 0) return 'Keine Produkte'
  return count === 1 ? '1 Produkt' : `${String(count)} Produkte`
}
