import { ChartColumn, LayoutGrid, Package, Plus, ShoppingBasket, type LucideIcon } from "lucide-react";

export type TabKey = "uebersicht" | "vorrat" | "hinzufuegen" | "statistik" | "nachkaufen";

export const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "uebersicht", label: "Übersicht", icon: LayoutGrid },
  { key: "vorrat", label: "Vorrat", icon: Package },
  { key: "hinzufuegen", label: "Neu", icon: Plus },
  { key: "statistik", label: "Statistik", icon: ChartColumn },
  { key: "nachkaufen", label: "Einkauf", icon: ShoppingBasket },
];

export const SCREEN_TITLES: Record<TabKey, string> = {
  uebersicht: "Dein Vorrat",
  vorrat: "Vorrat",
  hinzufuegen: "Hinzufügen",
  statistik: "Statistik & Check-in",
  nachkaufen: "Nachkaufen",
};
