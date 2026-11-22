import { CATEGORIES } from "./categories";
import type { Ampel, Category, CategoryKey, Member, Product, StockUnit } from "./types";

const DAY_MS = 86_400_000;
export const KCAL_PER_DAY = { erwachsen: 2200, senior: 2200, kind: 2200, baby: 0 } as const;
const WATER_ML_PER_DAY = { erwachsen: 2000, senior: 2000, kind: 1000, baby: 0 } as const;

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / DAY_MS);
}

export function ampelFor(mhd: string, today: string): Ampel {
  const days = daysBetween(today, mhd);
  if (days < 0) return "rot";
  if (days <= 28) return "orange";
  if (days <= 90) return "gelb";
  return "gruen";
}

/** Einheiten, die am Stichtag noch haltbar sind. */
export function validUnits(product: Product, onDate: string): StockUnit[] {
  return product.units.filter((u) => u.mhd >= onDate);
}

function totalKcal(products: Product[], onDate: string): number {
  return products.reduce(
    (sum, p) => sum + (validUnits(p, onDate).length * p.contentPerUnit * p.kcalPer100) / 100,
    0,
  );
}

function totalAmount(products: Product[], category: CategoryKey, onDate: string): number {
  return products
    .filter((p) => p.category === category)
    .reduce((sum, p) => sum + validUnits(p, onDate).length * p.contentPerUnit, 0);
}

function dailyNeed(members: Member[]) {
  return {
    kcal: members.reduce((s, m) => s + KCAL_PER_DAY[m.kind], 0),
    waterMl: members.reduce((s, m) => s + WATER_ML_PER_DAY[m.kind], 0),
  };
}

/** Versorgte Tage = Engpass aus Energie und Wasser. */
export function suppliedDays(products: Product[], members: Member[], onDate: string) {
  const need = dailyNeed(members);
  const energyDays = totalKcal(products, onDate) / need.kcal;
  const waterDays = totalAmount(products, "wasser", onDate) / need.waterMl;
  return {
    energyDays: Math.floor(energyDays * 10) / 10,
    waterDays: Math.floor(waterDays * 10) / 10,
    days: Math.floor(Math.min(energyDays, waterDays) * 10) / 10,
  };
}

export interface CategoryProgress {
  key: CategoryKey;
  label: string;
  emoji: string;
  current: number;
  target: number;
  percent: number;
}

/** Erfüllungsgrad je Warengruppe gegenüber der Empfehlung für `goalDays`. */
export function categoryProgress(
  products: Product[],
  members: Member[],
  goalDays: number,
  onDate: string,
): CategoryProgress[] {
  const persons = members.filter((m) => m.kind !== "baby").length;
  return CATEGORIES.filter((c) => c.targetPerPerson10Days > 0).map((c) =>
    progressFor(products, c, (c.targetPerPerson10Days / 10) * goalDays * persons, onDate),
  );
}

/** Erfüllungsgrad einer Warengruppe gegenüber einer vorgegebenen Zielmenge (`target` > 0). */
export function progressFor(products: Product[], category: Category, target: number, onDate: string): CategoryProgress {
  const current = totalAmount(products, category.key, onDate);
  return { key: category.key, label: category.label, emoji: category.emoji, current, target, percent: Math.round((current / target) * 100) };
}

export function overallPercent(progress: CategoryProgress[]): number {
  const capped = progress.map((p) => Math.min(p.percent, 150));
  return Math.round(capped.reduce((a, b) => a + b, 0) / capped.length);
}

export interface ExpiringUnit {
  product: Product;
  unit: StockUnit;
  ampel: Ampel;
  daysLeft: number;
}

/** Alle Einheiten, die nicht grün sind, nach MHD sortiert. */
export function expiringSoon(products: Product[], today: string): ExpiringUnit[] {
  return products
    .flatMap((product) =>
      product.units.map((unit) => ({
        product,
        unit,
        ampel: ampelFor(unit.mhd, today),
        daysLeft: daysBetween(today, unit.mhd),
      })),
    )
    .filter((e) => e.ampel !== "gruen")
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export function formatAmount(value: number, unit: "g" | "ml"): string {
  if (value >= 1000) return `${(value / 1000).toLocaleString("de-DE", { maximumFractionDigits: 1 })} ${unit === "g" ? "kg" : "l"}`;
  return `${value} ${unit}`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
