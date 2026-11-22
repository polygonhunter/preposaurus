import { formatAmount } from "@/lib/supply";
import type { Container, Product, StockUnit } from "@/lib/types";

export const CONTAINER_PLURAL: Record<Container, string> = {
  dose: "Dosen",
  glas: "Gläser",
  packung: "Packungen",
  flasche: "Flaschen",
  tetrapak: "Tetrapaks",
  beutel: "Beutel",
};

export function formatDecimal(value: number, decimals = 0): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** „6 × 500 g“ */
export function quantityLabel(product: Product): string {
  return `${product.units.length} × ${formatAmount(product.contentPerUnit, product.unit)}`;
}

export function sortedUnits(units: StockUnit[]): StockUnit[] {
  return units.slice().sort((a, b) => a.mhd.localeCompare(b.mhd));
}

/** „09/2027“ */
export function monthYear(iso: string): string {
  const [year, month] = iso.split("-");
  return `${month}/${year}`;
}

/** Letzter Tag des Monats als ISO-Datum (Monat 1-basiert). */
export function endOfMonthIso(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}

export function productKcal(product: Product): number {
  return (product.units.length * product.contentPerUnit * product.kcalPer100) / 100;
}

/** Gruppiert MHDs nach Monat: „09/2027 (6×)“ */
export function mhdGroups(units: StockUnit[]): string[] {
  const counts = new Map<string, number>();
  for (const unit of sortedUnits(units)) {
    const key = monthYear(unit.mhd);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([key, count]) => `${key} (${count}×)`);
}
