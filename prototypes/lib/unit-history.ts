import { ampelFor } from "./supply";
import type { CategoryKey, Container, Product, RestockItem, StockUnit } from "./types";

/** Was mit einer Einheit passiert ist, die den Vorrat verlassen hat. */
export type UnitOutcome = "verbraucht" | "entsorgt";

export interface HistoryEntry {
  id: string;
  productId: string;
  productName: string;
  category: CategoryKey;
  container: Container;
  mhd: string;
  outcome: UnitOutcome;
  /** ISO-Datum der Entscheidung */
  date: string;
}

/** „Noch gut“: Einheit trotz überschrittenem MHD geprüft, Wert = ISO-Datum der Prüfung. */
export type UnitChecks = Record<string, string>;

/** Aus dem MHD berechnet, nie gespeichert. */
export type UnitStatus = "gut" | "bald" | "abgelaufen";

export function unitStatus(unit: StockUnit, today: string): UnitStatus {
  const ampel = ampelFor(unit.mhd, today);
  if (ampel === "rot") return "abgelaufen";
  if (ampel === "gruen") return "gut";
  return "bald";
}

export function sortByMhd(units: StockUnit[]): StockUnit[] {
  return [...units].sort((a, b) => a.mhd.localeCompare(b.mhd));
}

interface ResolveInput {
  productId: string;
  unitId: string;
  outcome: UnitOutcome;
  date: string;
}

/** Nimmt eine Einheit aus dem Vorrat und liefert den Historien-Eintrag dazu (statt sie zu löschen). */
export function resolveUnit<T extends Product>(products: T[], { productId, unitId, outcome, date }: ResolveInput) {
  const product = products.find((p) => p.id === productId);
  const unit = product?.units.find((u) => u.id === unitId);
  if (!product || !unit) return { products, entry: null };
  const entry: HistoryEntry = {
    id: `${unitId}-${outcome}`,
    productId,
    productName: product.name,
    category: product.category,
    container: product.container,
    mhd: unit.mhd,
    outcome,
    date,
  };
  const next = products.map((p) => (p === product ? { ...p, units: p.units.filter((u) => u.id !== unitId) } : p));
  return { products: next, entry };
}

/** Steht das Produkt auf der offenen Nachkaufen-Liste? Zuordnung über Produktname oder Warengruppe. */
export function isOnRestockList(product: Product, items: RestockItem[], categoryLabel: string): boolean {
  return items.some((item) => !item.done && (item.label === product.name || item.label === categoryLabel));
}
