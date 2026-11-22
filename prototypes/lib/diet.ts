import { CATEGORIES } from "./categories";
import { progressFor, type CategoryProgress } from "./supply";
import type { CategoryKey, Diet, Member, Product } from "./types";

export const DIET_LABELS: Record<Diet, string> = {
  alles: "alles",
  vegetarisch: "vegetarisch",
  vegan: "vegan",
};

export const DIETS = Object.keys(DIET_LABELS) as Diet[];

type Shares = Partial<Record<CategoryKey, number>>;

/**
 * PROTOTYP-ANNAHME (nicht quellengeprüft): Was eine Ernährungsform weglässt, wird mengengleich
 * (Gramm) auf pflanzliche Gruppen verteilt. Vor der Umsetzung gegen BLE/DGE-Primärquellen prüfen.
 * - vegetarisch: „Fisch, Fleisch, Eier“ → 2/3 Hülsenfrüchte (Gemüse & Hülsenfrüchte), 1/3 Nüsse (Obst & Nüsse)
 * - vegan: zusätzlich „Milch & Milchprodukte“ → 1/2 Hülsenfrüchte/Soja, 1/2 Obst & Nüsse
 *   (angereicherte Pflanzendrinks werden hier vereinfacht nicht eigens gezählt)
 */
const REPLACEMENTS: Record<Diet, Partial<Record<CategoryKey, Shares>>> = {
  alles: {},
  vegetarisch: {
    fleisch_fisch_eier: { gemuese_huelsenfruechte: 2 / 3, obst_nuesse: 1 / 3 },
  },
  vegan: {
    fleisch_fisch_eier: { gemuese_huelsenfruechte: 2 / 3, obst_nuesse: 1 / 3 },
    milch: { gemuese_huelsenfruechte: 1 / 2, obst_nuesse: 1 / 2 },
  },
};

/** Ernährungsform eines Mitglieds; ohne eigene Angabe gilt der Haushalts-Standard. */
function effectiveDiet(member: Member, householdDiet: Diet): Diet {
  return member.diet ?? householdDiet;
}

/** Warengruppen, die bei dieser Ernährungsform nicht zum Ziel zählen. */
function excludedCategories(diet: Diet): CategoryKey[] {
  return Object.keys(REPLACEMENTS[diet]) as CategoryKey[];
}

/** Zielmengen (g/ml) pro Person für 10 Tage nach Ernährungsform; die Gesamtmenge bleibt gleich. */
function targetsPerPerson10Days(diet: Diet): Record<CategoryKey, number> {
  const targets = Object.fromEntries(CATEGORIES.map((c) => [c.key, c.targetPerPerson10Days])) as Record<CategoryKey, number>;
  for (const [removed, shares] of Object.entries(REPLACEMENTS[diet]) as [CategoryKey, Shares][]) {
    const amount = targets[removed];
    targets[removed] = 0;
    for (const [into, share] of Object.entries(shares) as [CategoryKey, number][]) targets[into] += amount * share;
  }
  return targets;
}

/** Haushaltsziel je Warengruppe für `goalDays`: pro Person nach Ernährungsform berechnet und summiert. */
function householdTargets(members: Member[], householdDiet: Diet, goalDays: number): Record<CategoryKey, number> {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c.key, 0])) as Record<CategoryKey, number>;
  for (const member of members.filter((m) => m.kind !== "baby")) {
    const perPerson = targetsPerPerson10Days(effectiveDiet(member, householdDiet));
    for (const c of CATEGORIES) totals[c.key] += (perPerson[c.key] / 10) * goalDays;
  }
  return totals;
}

/** Wie `categoryProgress`, aber mit Zielen nach Ernährungsform; Gruppen ohne Ziel entfallen. */
export function dietCategoryProgress(
  products: Product[],
  members: Member[],
  householdDiet: Diet,
  goalDays: number,
  onDate: string,
): CategoryProgress[] {
  const targets = householdTargets(members, householdDiet, goalDays);
  return CATEGORIES.filter((c) => targets[c.key] > 0).map((c) => progressFor(products, c, targets[c.key], onDate));
}

interface DietConflict {
  member: Member;
  diet: Diet;
}

/** Mitglieder, für deren Ernährungsform das Produkt nicht zum Ziel zählt (nach Warengruppe). */
export function dietConflicts(product: Product, members: Member[], householdDiet: Diet): DietConflict[] {
  return members
    .map((member) => ({ member, diet: effectiveDiet(member, householdDiet) }))
    .filter(({ diet }) => excludedCategories(diet).includes(product.category));
}

/** Vegan im Haushalt → freundlicher Hinweis auf Vitamin B12. */
export function needsB12Hint(members: Member[], householdDiet: Diet): boolean {
  return members.some((m) => effectiveDiet(m, householdDiet) === "vegan");
}
