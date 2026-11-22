import { daysBetween, type ExpiringUnit } from "./supply";
import type { Ampel, Product, StockUnit } from "./types";
import type { UnitStatus } from "./unit-history";

/** Einstellbare MHD-Ampel: ab wie vielen Resttagen eine Einheit gelb bzw. orange wird. */
export interface AmpelRules {
  soonDays: number;
  urgentDays: number;
}

/** Entspricht den festen Schwellen von `ampelFor` (≤ 3 Monate gelb, ≤ 4 Wochen orange). */
export const DEFAULT_AMPEL_RULES: AmpelRules = { soonDays: 90, urgentDays: 28 };

export const SOON_DAY_OPTIONS = [30, 60, 90, 120, 180];
export const URGENT_DAY_OPTIONS = [7, 14, 21, 28, 42];

/** Wie `ampelFor`, aber mit Schwellen aus den Einstellungen. */
export function ampelWithRules(mhd: string, today: string, rules: AmpelRules): Ampel {
  const days = daysBetween(today, mhd);
  if (days < 0) return "rot";
  if (days <= rules.urgentDays) return "orange";
  if (days <= rules.soonDays) return "gelb";
  return "gruen";
}

/** Wie `unitStatus`, aber mit Schwellen aus den Einstellungen. */
export function unitStatusWithRules(unit: StockUnit, today: string, rules: AmpelRules): UnitStatus {
  const ampel = ampelWithRules(unit.mhd, today, rules);
  if (ampel === "rot") return "abgelaufen";
  if (ampel === "gruen") return "gut";
  return "bald";
}

/** Alle Einheiten mit Ampel und Resttagen, nach MHD sortiert. */
export function unitsWithAmpel(products: Product[], today: string, rules: AmpelRules): ExpiringUnit[] {
  return products
    .flatMap((product) =>
      product.units.map((unit) => ({
        product,
        unit,
        ampel: ampelWithRules(unit.mhd, today, rules),
        daysLeft: daysBetween(today, unit.mhd),
      })),
    )
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Wie `expiringSoon`: alle Einheiten, die nicht grün sind. */
export function expiringSoonWithRules(products: Product[], today: string, rules: AmpelRules): ExpiringUnit[] {
  return unitsWithAmpel(products, today, rules).filter((e) => e.ampel !== "gruen");
}

/** Neue Gelb-Schwelle; Orange wird bei Bedarf auf den größten noch kleineren Wert gesenkt. */
export function withSoonDays(rules: AmpelRules, soonDays: number): AmpelRules {
  if (rules.urgentDays < soonDays) return { ...rules, soonDays };
  const urgentDays = Math.max(...URGENT_DAY_OPTIONS.filter((d) => d < soonDays));
  return { soonDays, urgentDays };
}
