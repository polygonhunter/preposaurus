"use client";

import type { UserCategory } from "@/lib/settings-types";
import { useSettingsContext } from "../state/context";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { CategoriesGroup } from "./CategoriesGroup";
import { LocationsGroup } from "./LocationsGroup";

/** Haushalt → Vorrat-Stammdaten: eigene Kategorien (mit Warengruppe) und Lagerorte. */
export function MasterDataPage() {
  const { settings } = useSettingsContext();
  const { masterData, patchMasterData } = settings;

  const setHidden = (id: string, hidden: boolean) =>
    patchMasterData({ categories: masterData.categories.map((c: UserCategory) => (c.id === id ? { ...c, hidden } : c)) });

  return (
    <SettingsPageFrame intro="Kategorien sind deine eigene Ordnung. Für die Empfehlung zählt die zugeordnete Warengruppe.">
      <CategoriesGroup categories={masterData.categories} onHiddenChange={setHidden} />
      <LocationsGroup locations={masterData.locations} onChange={(locations) => patchMasterData({ locations })} />
    </SettingsPageFrame>
  );
}
