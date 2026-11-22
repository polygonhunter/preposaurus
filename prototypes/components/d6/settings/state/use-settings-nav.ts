"use client";

import { useState } from "react";
import type { SettingsRoute } from "../routes";

const ROOT: SettingsRoute = { page: "root" };

/** Navigations-Stapel der Einstellungen; `null` = Einstellungen geschlossen. */
export function useSettingsNav() {
  const [stack, setStack] = useState<SettingsRoute[] | null>(null);

  return {
    stack,
    isOpen: stack !== null,
    /** Öffnet die Einstellungen, optional direkt auf einer Unterseite (Deep-Link aus dem Dashboard). */
    open: (path: SettingsRoute[] = []) => setStack([ROOT, ...path]),
    close: () => setStack(null),
    push: (route: SettingsRoute) => setStack((prev) => [...(prev ?? [ROOT]), route]),
    /** Ersetzt die aktuelle Seite (z. B. nach dem Anlegen direkt ins Formular). */
    replace: (route: SettingsRoute) => setStack((prev) => [...(prev ?? [ROOT]).slice(0, -1), route]),
    /** Springt auf eine Ebene des Stapels zurück (Brotkrumen). */
    goTo: (depth: number) => setStack((prev) => (prev ? prev.slice(0, depth + 1) : prev)),
    back: () => setStack((prev) => (prev && prev.length > 1 ? prev.slice(0, -1) : null)),
  };
}

export type SettingsNav = ReturnType<typeof useSettingsNav>;
