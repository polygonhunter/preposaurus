import { ChartColumn, LayoutGrid, Package, Plus, ShoppingBasket, type LucideIcon } from "lucide-react";

export type TabKey = "uebersicht" | "vorrat" | "hinzufuegen" | "statistik" | "nachkaufen";

export const TABS: { key: TabKey; label: string; title: string; icon: LucideIcon }[] = [
  { key: "uebersicht", label: "Übersicht", title: "Dein Vorrat", icon: LayoutGrid },
  { key: "vorrat", label: "Vorrat", title: "Vorrat", icon: Package },
  { key: "hinzufuegen", label: "Neu", title: "Hinzufügen", icon: Plus },
  { key: "statistik", label: "Statistik", title: "Statistik & Check-in", icon: ChartColumn },
  { key: "nachkaufen", label: "Einkauf", title: "Nachkaufen", icon: ShoppingBasket },
];

export function screenTitle(tab: TabKey): string {
  return TABS.find((t) => t.key === tab)?.title ?? "";
}
