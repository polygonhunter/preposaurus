"use client";

import { createContext, useContext } from "react";
import type { Cockpit } from "../../data/use-cockpit";
import type { ThemeState } from "../../theme/use-theme";
import type { SettingsNav } from "./use-settings-nav";
import type { SettingsState } from "./use-settings";

export interface SettingsContextValue {
  cockpit: Cockpit;
  settings: SettingsState;
  nav: SettingsNav;
  theme: ThemeState;
  today: string;
  /** Mitglied schaut auf einen Admin-Bereich: nur lesen */
  readOnly: boolean;
}

export const SettingsContext = createContext<SettingsContextValue | null>(null);

/** Zugriff der Einstellungsseiten auf State und Navigation, ohne Props durch jede Ebene zu reichen. */
export function useSettingsContext(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (!value) throw new Error("Einstellungsseiten brauchen den SettingsContext.");
  return value;
}
