"use client";

import { useState } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { AddScreen } from "./add/AddScreen";
import type { StockDraft } from "./data/stock";
import { screenTitle, type TabKey } from "./data/tabs";
import { useCockpit } from "./data/use-cockpit";
import { useScreenFlip } from "./motion/use-screen-flip";
import { OverviewScreen } from "./overview/OverviewScreen";
import { RestockScreen } from "./restock/RestockScreen";
import type { SettingsRoute } from "./settings/routes";
import { SettingsScreen } from "./settings/SettingsScreen";
import { useSettings } from "./settings/state/use-settings";
import { useSettingsNav } from "./settings/state/use-settings-nav";
import { StatsScreen } from "./stats/StatsScreen";
import { StockScreen } from "./stock/StockScreen";
import { useTheme } from "./theme/use-theme";
import { AppHeader } from "./ui/AppHeader";
import { MeshBackground } from "./ui/MeshBackground";
import { TabBar } from "./ui/TabBar";

const SETTINGS_SCREEN = "einstellungen";

/** Wurzel des Glas-Cockpits: Tab-, Vorrats- und Einstellungs-State, Kachel→Screen-Übergänge per Flip. */
export function CockpitApp({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<TabKey>("uebersicht");
  const cockpit = useCockpit(data);
  const settings = useSettings();
  const settingsNav = useSettingsNav();
  const theme = useTheme();
  const screenKey = settingsNav.isOpen ? SETTINGS_SCREEN : tab;
  const { screenRef, capture } = useScreenFlip(screenKey);

  /** Wechselt den Tab (schließt dabei die Einstellungen); mit Quell-Kachel per Flip. */
  const navigate = (next: TabKey, sourceTile?: HTMLElement | null) => {
    if (next === tab && !settingsNav.isOpen) return;
    capture(sourceTile);
    settingsNav.close();
    setTab(next);
  };

  /** Öffnet die Einstellungen, optional direkt auf einer Unterseite („Bearbeiten →“). */
  const openSettings = (path: SettingsRoute[], source?: HTMLElement | null) => {
    capture(source);
    settingsNav.open(path);
  };

  const toggleSettings = (source: HTMLElement | null) => {
    if (!settingsNav.isOpen) return openSettings([], source);
    capture(null);
    settingsNav.close();
  };

  const addToStock = (draft: StockDraft) => {
    cockpit.stock.addDraft(draft);
    navigate("vorrat");
  };

  return (
    <div className="relative isolate min-h-dvh text-(--d6-text)">
      <MeshBackground />
      <div className="mx-auto w-full max-w-[460px] px-4 pb-32 pt-[max(1.25rem,env(safe-area-inset-top))] md:max-w-4xl md:pt-10">
        <AppHeader
          title={settingsNav.isOpen ? "Einstellungen" : screenTitle(tab)}
          today={data.today}
          settingsOpen={settingsNav.isOpen}
          onToggleSettings={toggleSettings}
        />
        <main key={screenKey} ref={screenRef} data-flip-id={`tile-${screenKey}`} className="rounded-[28px]">
          {settingsNav.isOpen ? (
            <SettingsScreen nav={settingsNav} cockpit={cockpit} settings={settings} theme={theme} today={data.today} />
          ) : (
            <>
              {tab === "uebersicht" && <OverviewScreen cockpit={cockpit} onNavigate={navigate} onEditSettings={openSettings} />}
              {tab === "vorrat" && <StockScreen cockpit={cockpit} today={data.today} />}
              {tab === "hinzufuegen" && (
                <AddScreen sample={data.products[0]} today={data.today} products={cockpit.products} onAdd={addToStock} />
              )}
              {tab === "statistik" && <StatsScreen data={data} cockpit={cockpit} onOpenStock={() => navigate("vorrat")} />}
              {tab === "nachkaufen" && <RestockScreen items={cockpit.restock} onToggle={cockpit.toggleRestock} />}
            </>
          )}
        </main>
      </div>
      <TabBar active={settingsNav.isOpen ? null : tab} badges={{ nachkaufen: cockpit.openRestock.length }} onChange={(next) => navigate(next)} />
    </div>
  );
}
