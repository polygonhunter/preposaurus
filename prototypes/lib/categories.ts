import type { Category, CategoryKey } from "./types";

/** Werte grob nach BLE-Vorratskalkulator (10 Tage, 1 Person). Nur für Prototypen. */
export const CATEGORIES: Category[] = [
  { key: "getreide", label: "Getreide, Nudeln, Reis", emoji: "🍝", targetPerPerson10Days: 3500, unit: "g" },
  { key: "gemuese_huelsenfruechte", label: "Gemüse & Hülsenfrüchte", emoji: "🥫", targetPerPerson10Days: 4000, unit: "g" },
  { key: "obst_nuesse", label: "Obst & Nüsse", emoji: "🍑", targetPerPerson10Days: 2500, unit: "g" },
  { key: "milch", label: "Milch & Milchprodukte", emoji: "🥛", targetPerPerson10Days: 2600, unit: "g" },
  { key: "fleisch_fisch_eier", label: "Fisch, Fleisch, Eier", emoji: "🐟", targetPerPerson10Days: 1500, unit: "g" },
  { key: "fette_oele", label: "Fette & Öle", emoji: "🫒", targetPerPerson10Days: 357, unit: "g" },
  { key: "wasser", label: "Wasser", emoji: "💧", targetPerPerson10Days: 20000, unit: "ml" },
  { key: "getraenke", label: "Getränke", emoji: "🧃", targetPerPerson10Days: 0, unit: "ml" },
  { key: "fertiggerichte", label: "Fertiggerichte", emoji: "🍲", targetPerPerson10Days: 0, unit: "g" },
  { key: "sonstiges", label: "Sonstiges", emoji: "🍯", targetPerPerson10Days: 0, unit: "g" },
];

export function getCategory(key: CategoryKey): Category {
  const category = CATEGORIES.find((c) => c.key === key);
  if (!category) throw new Error(`Unbekannte Kategorie: ${key}`);
  return category;
}

export const CONTAINER_LABELS = {
  dose: "Dose",
  glas: "Glas",
  packung: "Packung",
  flasche: "Flasche",
  tetrapak: "Tetrapak",
  beutel: "Beutel",
} as const;
