import { formatAmount } from "@/lib/supply";
import type { Container, Product } from "@/lib/types";

export const CONTAINER_PLURAL: Record<Container, string> = {
  dose: "Dosen",
  glas: "Gläser",
  packung: "Packungen",
  flasche: "Flaschen",
  tetrapak: "Tetrapaks",
  beutel: "Beutel",
};

export interface MonthYear {
  year: number;
  /** 1–12 */
  month: number;
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/** „31.12.“ */
export function formatDayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", timeZone: "UTC" });
}

/** „6 × 500 g“ */
export function quantityLabel(count: number, product: Pick<Product, "contentPerUnit" | "unit">): string {
  return `${count} × ${formatAmount(product.contentPerUnit, product.unit)}`;
}

/** „noch 7 Tage“ bzw. „seit 5 Tagen abgelaufen“ */
export function daysLeftLabel(daysLeft: number): string {
  if (daysLeft < 0) return `seit ${-daysLeft} ${-daysLeft === 1 ? "Tag" : "Tagen"} abgelaufen`;
  return `noch ${daysLeft} ${daysLeft === 1 ? "Tag" : "Tage"}`;
}

/** Letzter Tag des Monats als ISO-Datum (MHD-Angaben „Monat/Jahr“). */
export function endOfMonthIso({ year, month }: MonthYear): string {
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function shiftMonths(iso: string, months: number): MonthYear {
  const [year, month] = iso.split("-").map(Number);
  const index = year * 12 + (month - 1) + months;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** „07.10.26“ – kompakt für Einheiten-Listen. */
export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "UTC" });
}
