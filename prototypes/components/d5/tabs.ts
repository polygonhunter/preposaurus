import { Boxes, ChartColumn, House, Plus, ShoppingBasket, type LucideIcon } from "lucide-react";
import type { Tone } from "./theme";

export type TabKey = "overview" | "stock" | "add" | "stats" | "restock";

export interface TabDefinition {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  tone: Tone;
}

export const TABS: TabDefinition[] = [
  { key: "overview", label: "Übersicht", icon: House, tone: "green" },
  { key: "stock", label: "Vorrat", icon: Boxes, tone: "orange" },
  { key: "add", label: "Hinzufügen", icon: Plus, tone: "blue" },
  { key: "stats", label: "Statistik", icon: ChartColumn, tone: "purple" },
  { key: "restock", label: "Nachkaufen", icon: ShoppingBasket, tone: "pink" },
];
