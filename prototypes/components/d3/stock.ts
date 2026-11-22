import { ampelFor, formatAmount } from "@/lib/supply";
import type { Ampel, CategoryKey, Container, Product, Unit } from "@/lib/types";

export const CONTAINER_PLURAL: Record<Container, string> = {
  dose: "Dosen",
  glas: "Gläser",
  packung: "Packungen",
  flasche: "Flaschen",
  tetrapak: "Tetrapaks",
  beutel: "Beutel",
};

export interface StockDraft {
  name: string;
  category: CategoryKey;
  container: Container;
  contentPerUnit: number;
  unit: Unit;
  kcalPer100: number;
  mhds: string[];
}

export function earliestMhd(product: Product): string | undefined {
  return product.units.map((u) => u.mhd).sort()[0];
}

export function productAmpel(product: Product, today: string): Ampel | undefined {
  const mhd = earliestMhd(product);
  return mhd ? ampelFor(mhd, today) : undefined;
}

export function quantityLabel(count: number, product: Pick<Product, "contentPerUnit" | "unit">): string {
  return `${count} × ${formatAmount(product.contentPerUnit, product.unit)}`;
}

export function draftFromProduct(product: Product, mhds: string[]): StockDraft {
  const { name, category, container, contentPerUnit, unit, kcalPer100 } = product;
  return { name, category, container, contentPerUnit, unit, kcalPer100, mhds };
}

/** Entnimmt die Einheit mit dem frühesten MHD. */
export function takeEarliest(products: Product[], productId: string): Product[] {
  return products.map((p) => {
    if (p.id !== productId || p.units.length === 0) return p;
    const sorted = [...p.units].sort((a, b) => a.mhd.localeCompare(b.mhd));
    return { ...p, units: sorted.slice(1) };
  });
}

/** Fügt Einheiten hinzu – zu einem passenden Produkt oder als neues Produkt. */
export function addStock(products: Product[], draft: StockDraft, idSeed: number): Product[] {
  const units = draft.mhds.map((mhd, i) => ({ id: `n${idSeed}-${i}`, mhd }));
  const match = products.find(
    (p) => p.name === draft.name && p.contentPerUnit === draft.contentPerUnit && p.container === draft.container,
  );
  if (match) return products.map((p) => (p === match ? { ...p, units: [...p.units, ...units] } : p));
  const { name, category, container, contentPerUnit, unit, kcalPer100 } = draft;
  const fields = { name, category, container, contentPerUnit, unit, kcalPer100 };
  const product: Product = { ...fields, id: `n${idSeed}`, location: "Keller", units };
  return [...products, product];
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatDayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

/** Letzter Tag des Monats als ISO-Datum (MHD-Angaben „Monat/Jahr“). */
export function endOfMonthIso(year: number, month: number): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function shiftMonths(iso: string, months: number): { year: number; month: number } {
  const date = new Date(iso);
  const total = date.getUTCFullYear() * 12 + date.getUTCMonth() + months;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}
