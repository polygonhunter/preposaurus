import { KCAL_PER_DAY, validUnits } from "./supply";
import type { CategoryKey, Macros, Member, Product } from "./types";

export type MacroKey = keyof Macros;

export const MACRO_KEYS: MacroKey[] = ["protein", "carbs", "fat"];

export const MACRO_LABELS: Record<MacroKey, { label: string; short: string }> = {
  protein: { label: "Eiweiß", short: "E" },
  carbs: { label: "Kohlenhydrate", short: "K" },
  fat: { label: "Fett", short: "F" },
};

/** Physiologische Brennwerte (kcal je g). */
const KCAL_PER_GRAM: Record<MacroKey, number> = { protein: 4, carbs: 4, fat: 9 };

/**
 * PROTOTYP-WERTE, vor Umsetzung gegen DGE prüfen:
 * Eiweiß in g je kg Referenzgewicht, Fett 30 % und Kohlenhydrate 50 % der Tagesenergie.
 */
const PROTEIN_REFERENCE: Record<Member["kind"], { weightKg: number; gramsPerKg: number }> = {
  erwachsen: { weightKg: 70, gramsPerKg: 0.8 },
  kind: { weightKg: 20, gramsPerKg: 0.9 }, // Kind ~6 Jahre
  senior: { weightKg: 70, gramsPerKg: 1.0 },
  baby: { weightKg: 0, gramsPerKg: 0 }, // Sonderbedarf, zählt nicht mit
};
const ENERGY_SHARE = { fat: 0.3, carbs: 0.5 } as const;

/** Makro-Bedarf (g) einer Person pro Tag. */
function dailyMacroNeed(member: Member): Macros {
  const kcal = KCAL_PER_DAY[member.kind];
  const { weightKg, gramsPerKg } = PROTEIN_REFERENCE[member.kind];
  return {
    protein: weightKg * gramsPerKg,
    carbs: (kcal * ENERGY_SHARE.carbs) / KCAL_PER_GRAM.carbs,
    fat: (kcal * ENERGY_SHARE.fat) / KCAL_PER_GRAM.fat,
  };
}

function sumMacros(list: Macros[]): Macros {
  return list.reduce((s, m) => ({ protein: s.protein + m.protein, carbs: s.carbs + m.carbs, fat: s.fat + m.fat }), {
    protein: 0,
    carbs: 0,
    fat: 0,
  });
}

function averageMacros(list: Macros[]): Macros | null {
  if (list.length === 0) return null;
  const total = sumMacros(list);
  return { protein: total.protein / list.length, carbs: total.carbs / list.length, fat: total.fat / list.length };
}

const NO_MACROS: Macros = { protein: 0, carbs: 0, fat: 0 };

/** Ø-Makros einer Kategorie aus gemessenen Produkten (ohne Wasser), sonst Ø des ganzen Vorrats. */
export function estimateMacrosPer100(products: Product[], category: CategoryKey): Macros {
  const measured = products.filter((p) => p.macrosPer100 && p.category !== "wasser");
  const pick = (list: Product[]) => averageMacros(list.flatMap((p) => (p.macrosPer100 ? [p.macrosPer100] : [])));
  return pick(measured.filter((p) => p.category === category)) ?? pick(measured) ?? NO_MACROS;
}

export interface ResolvedMacros {
  per100: Macros;
  estimated: boolean;
}

/** Makros eines Produkts: angegeben oder geschätzt. Wasser hat keine Makros. */
export function resolveMacros(product: Pick<Product, "macrosPer100" | "category">, products: Product[]): ResolvedMacros {
  if (product.macrosPer100) return { per100: product.macrosPer100, estimated: false };
  if (product.category === "wasser") return { per100: NO_MACROS, estimated: false };
  return { per100: estimateMacrosPer100(products, product.category), estimated: true };
}

interface MacroStock {
  grams: Macros;
  /** mindestens ein Produkt mit Bestand ist geschätzt */
  partlyEstimated: boolean;
}

/** Bestand in Gramm je Makro, nur am Stichtag haltbare Einheiten. ml werden vereinfacht wie g gezählt. */
export function macroStock(products: Product[], onDate: string): MacroStock {
  const withStock = products.filter((p) => validUnits(p, onDate).length > 0);
  const parts = withStock.map((p) => {
    const { per100, estimated } = resolveMacros(p, products);
    const factor = (validUnits(p, onDate).length * p.contentPerUnit) / 100;
    return { estimated, grams: { protein: per100.protein * factor, carbs: per100.carbs * factor, fat: per100.fat * factor } };
  });
  return { grams: sumMacros(parts.map((p) => p.grams)), partlyEstimated: parts.some((p) => p.estimated) };
}

export interface MacroDays {
  key: MacroKey;
  stockGrams: number;
  needPerDay: number;
  days: number;
  limiting: boolean;
}

/** „Reicht für X Tage“ je Makro; der kleinste Wert ist der Engpass. */
export function macroDays(stock: Macros, members: Member[]): MacroDays[] {
  const need = sumMacros(members.map(dailyMacroNeed));
  const rows = MACRO_KEYS.map((key) => ({
    key,
    stockGrams: stock[key],
    needPerDay: need[key],
    days: need[key] > 0 ? Math.floor((stock[key] / need[key]) * 10) / 10 : 0,
  }));
  const minDays = Math.min(...rows.map((r) => r.days));
  return rows.map((r) => ({ ...r, limiting: r.days === minDays }));
}

/** Ab diesem Verhältnis zu den Energie-Tagen gilt ein Makro als „deutlich darunter“. */
const GAP_RATIO = 0.75;

/** Makro-Engpass, der deutlich unter den Energie-Tagen liegt – sonst null. */
export function macroGap(rows: MacroDays[], energyDays: number): MacroDays | null {
  const lowest = rows.reduce((a, b) => (b.days < a.days ? b : a));
  return lowest.days < energyDays * GAP_RATIO ? lowest : null;
}

/** Energieanteil je Makro am Vorrat (0–1, Summe 1). */
export function macroEnergyShares(stock: Macros): Macros {
  const kcal = MACRO_KEYS.map((k) => stock[k] * KCAL_PER_GRAM[k]);
  const total = kcal.reduce((a, b) => a + b, 0);
  if (total === 0) return NO_MACROS;
  return { protein: kcal[0] / total, carbs: kcal[1] / total, fat: kcal[2] / total };
}

/** Ziel-Energieverteilung des Bedarfs (gleiche Prototyp-Annahmen wie oben) zum Vergleich. */
export function targetEnergyShares(members: Member[]): Macros {
  return macroEnergyShares(sumMacros(members.map(dailyMacroNeed)));
}
