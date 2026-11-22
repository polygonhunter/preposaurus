import { ChartColumn, Gauge, ListChecks, Package, ScanLine, type LucideIcon } from "lucide-react";

export type TabKey = "uebersicht" | "vorrat" | "hinzufuegen" | "statistik" | "nachkaufen";

export const TABS: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "uebersicht", label: "Übersicht", icon: Gauge },
  { key: "vorrat", label: "Vorrat", icon: Package },
  { key: "hinzufuegen", label: "Erfassen", icon: ScanLine },
  { key: "statistik", label: "Statistik", icon: ChartColumn },
  { key: "nachkaufen", label: "Nachkaufen", icon: ListChecks },
];
