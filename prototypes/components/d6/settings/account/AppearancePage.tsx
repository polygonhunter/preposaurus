"use client";

import { Moon, Sun } from "lucide-react";
import type { Theme } from "../../theme/theme";
import { TABS, type TabKey } from "../../data/tabs";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { useSettingsContext } from "../state/context";
import { Select } from "../ui/Select";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

const THEME_OPTIONS: { key: Theme; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Hell", icon: Sun },
  { key: "dark", label: "Dunkel", icon: Moon },
];

const START_OPTIONS = TABS.map(({ key, label }) => ({ key, label }));

/** Mein Konto → Darstellung: Farbschema (vorhandene Theme-Logik), Animationen, Startansicht. */
export function AppearancePage() {
  const { settings, theme } = useSettingsContext();
  const { appearance, patchAppearance } = settings;

  return (
    <SettingsPageFrame intro="Gilt nur für dich und dieses Gerät.">
      <SettingsGroup title="Farbschema" note="Standard ist hell.">
        <div className="p-3">
          <SegmentedControl label="Farbschema" value={theme.theme} options={THEME_OPTIONS} onChange={theme.setTheme} className="w-full" />
        </div>
      </SettingsGroup>
      <SettingsGroup
        title="Bewegung"
        note="Ist am Gerät „Bewegung reduzieren“ an, gilt das immer. Im Prototyp wird nur die Wahl gespeichert."
      >
        <SettingsRow
          kind="toggle"
          label="Animationen reduzieren"
          detail="Ruhigere Übergänge"
          checked={appearance.reduceMotion}
          onChange={(reduceMotion) => patchAppearance({ reduceMotion })}
        />
      </SettingsGroup>
      <SettingsGroup title="Start">
        <SettingsRow kind="value" label="Startansicht" detail="Was nach dem Öffnen zuerst kommt">
          <Select<TabKey> label="Startansicht" value={appearance.startView} options={START_OPTIONS} onChange={(startView) => patchAppearance({ startView })} />
        </SettingsRow>
      </SettingsGroup>
    </SettingsPageFrame>
  );
}
