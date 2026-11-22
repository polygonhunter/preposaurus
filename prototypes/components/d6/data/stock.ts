import { unitsWithAmpel, type AmpelRules } from "@/lib/ampel-rules";
import type { ExpiringUnit } from "@/lib/supply";
import type { CategoryKey, Container, Macros, Product, Unit } from "@/lib/types";

/** Produkt im lokalen Vorrat; `kcalEstimated` = Energie aus dem Kategorie-Durchschnitt geschätzt. */
export type StockProduct = Product & { kcalEstimated?: boolean };

export interface StockDraft {
  name: string;
  category: CategoryKey;
  container: Container;
  contentPerUnit: number;
  unit: Unit;
  kcalPer100: number;
  kcalEstimated: boolean;
  /** fehlt = Makros werden nach Kategorie geschätzt */
  macrosPer100?: Macros;
  mhds: string[];
}

/** Fügt Einheiten hinzu – zu einem passenden Produkt oder als neues Produkt. */
export function addStock(products: StockProduct[], draft: StockDraft, idSeed: number): StockProduct[] {
  const { mhds, ...fields } = draft;
  const units = mhds.map((mhd, i) => ({ id: `d6-${idSeed}-${i}`, mhd }));
  const match = products.find(
    (p) => p.name === fields.name && p.contentPerUnit === fields.contentPerUnit && p.container === fields.container,
  );
  if (match) return products.map((p) => (p === match ? { ...p, units: [...p.units, ...units] } : p));
  return [...products, { ...fields, id: `d6-${idSeed}`, location: "Keller", units }];
}

interface ScannedNutrition {
  kcalPer100: number;
  kcalEstimated: boolean;
  macrosPer100?: Macros;
}

export function draftFromProduct(product: Product, mhds: string[], nutrition: ScannedNutrition): StockDraft {
  const { name, category, container, contentPerUnit, unit } = product;
  return { name, category, container, contentPerUnit, unit, ...nutrition, mhds };
}

/** Alle Einheiten mit MHD vor dem Zieldatum – unabhängig von der Ampelfarbe. */
export function expiringBefore(products: Product[], today: string, targetDate: string, rules: AmpelRules): ExpiringUnit[] {
  return unitsWithAmpel(products, today, rules).filter((entry) => entry.unit.mhd < targetDate);
}

/** Fasst gleiche Produkte mit gleichem MHD zusammen („3 × Nudeln“). */
export function groupExpiring(entries: ExpiringUnit[]): { key: string; entry: ExpiringUnit; count: number }[] {
  const groups = new Map<string, { key: string; entry: ExpiringUnit; count: number }>();
  for (const entry of entries) {
    const key = `${entry.product.id}-${entry.unit.mhd}`;
    const existing = groups.get(key);
    groups.set(key, { key, entry, count: (existing?.count ?? 0) + 1 });
  }
  return [...groups.values()];
}

interface KcalEstimate {
  kcalPer100: number;
  /** false = keine Werte in der Kategorie, Ø des ganzen Vorrats genommen */
  fromCategory: boolean;
}

/** Schätzung ohne Nährwertangabe: Ø kcal/100 der Kategorie aus dem aktuellen (gemessenen) Bestand. */
export function estimateKcalPer100(products: StockProduct[], category: CategoryKey): KcalEstimate {
  const measured = products.filter((p) => !p.kcalEstimated && p.units.length > 0);
  const average = (list: Product[]) =>
    list.length > 0 ? Math.round(list.reduce((sum, p) => sum + p.kcalPer100, 0) / list.length) : null;
  const inCategory = average(measured.filter((p) => p.category === category));
  if (inCategory !== null) return { kcalPer100: inCategory, fromCategory: true };
  return { kcalPer100: average(measured.filter((p) => p.category !== "wasser")) ?? 0, fromCategory: false };
}
