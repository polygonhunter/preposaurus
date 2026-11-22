import { getCategory } from "@/lib/categories";
import { unitStatusWithRules, type AmpelRules } from "@/lib/ampel-rules";
import { isOnRestockList, type HistoryEntry, type UnitOutcome, type UnitStatus } from "@/lib/unit-history";
import type { RestockItem } from "@/lib/types";
import type { StockProduct } from "./stock";

export type StockView = "vorrat" | "bald" | "abgelaufen" | "nachkaufen" | UnitOutcome;

export const STOCK_VIEWS: { key: StockView; label: string }[] = [
  { key: "vorrat", label: "Im Vorrat" },
  { key: "bald", label: "Bald fällig" },
  { key: "abgelaufen", label: "Abgelaufen" },
  { key: "nachkaufen", label: "Nachkaufen" },
  { key: "verbraucht", label: "Verbraucht" },
  { key: "entsorgt", label: "Entsorgt" },
];

export function isHistoryView(view: StockView): view is UnitOutcome {
  return view === "verbraucht" || view === "entsorgt";
}

interface ViewContext {
  today: string;
  restock: RestockItem[];
  rules: AmpelRules;
}

function withUnitStatus(products: StockProduct[], status: UnitStatus, { today, rules }: ViewContext): StockProduct[] {
  return products
    .map((p) => ({ ...p, units: p.units.filter((u) => unitStatusWithRules(u, today, rules) === status) }))
    .filter((p) => p.units.length > 0);
}

/** Produkte einer Status-Ansicht; bei „bald fällig“/„abgelaufen“ nur mit den betroffenen Einheiten. */
export function productsForView(products: StockProduct[], view: StockView, context: ViewContext): StockProduct[] {
  if (view === "bald" || view === "abgelaufen") return withUnitStatus(products, view, context);
  if (view === "nachkaufen") return products.filter((p) => isOnRestockList(p, context.restock, getCategory(p.category).label));
  if (view === "vorrat") return products.filter((p) => p.units.length > 0);
  return [];
}

/** Zähler je Ansicht: Einheiten bzw. Produkte (Nachkaufen) bzw. Historien-Einträge. */
export function viewCounts(products: StockProduct[], history: HistoryEntry[], context: ViewContext): Record<StockView, number> {
  const unitCount = (list: StockProduct[]) => list.reduce((sum, p) => sum + p.units.length, 0);
  return {
    vorrat: unitCount(productsForView(products, "vorrat", context)),
    bald: unitCount(productsForView(products, "bald", context)),
    abgelaufen: unitCount(productsForView(products, "abgelaufen", context)),
    nachkaufen: productsForView(products, "nachkaufen", context).length,
    verbraucht: history.filter((h) => h.outcome === "verbraucht").length,
    entsorgt: history.filter((h) => h.outcome === "entsorgt").length,
  };
}
