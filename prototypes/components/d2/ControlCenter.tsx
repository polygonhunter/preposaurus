"use client";

import { useState, type ReactNode } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { AddScreen } from "./screens/AddScreen";
import { OverviewScreen } from "./screens/OverviewScreen";
import { RestockScreen } from "./screens/RestockScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { StockScreen } from "./screens/StockScreen";
import { TABS, type TabKey } from "./navigation";
import { TabBar } from "./TabBar";
import { TopBar } from "./TopBar";
import { GRID_BACKDROP, THEME_VARS } from "./theme";
import { usePantry } from "./use-pantry";

/** Wurzel des Kontrollzentrums: hält Tab- und Vorrats-State und tauscht die Screens. */
export function ControlCenter({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<TabKey>("uebersicht");
  const pantry = usePantry(data);
  const openRestock = pantry.restock.filter((item) => !item.done).length;
  const title = TABS.find((t) => t.key === tab)?.label ?? "";

  const screens: Record<TabKey, ReactNode> = {
    uebersicht: <OverviewScreen data={data} pantry={pantry} onOpenStock={() => setTab("vorrat")} />,
    vorrat: <StockScreen data={data} pantry={pantry} />,
    hinzufuegen: <AddScreen data={data} onSave={pantry.addProduct} />,
    statistik: <StatsScreen data={data} pantry={pantry} />,
    nachkaufen: <RestockScreen items={pantry.restock} onToggle={pantry.toggleRestock} />,
  };

  return (
    <div style={THEME_VARS} className="relative min-h-dvh bg-(--d2-bg) text-zinc-200">
      <div aria-hidden className="pointer-events-none fixed inset-0" style={GRID_BACKDROP} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(62,230,255,0.12),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-md px-4 pb-32 md:max-w-3xl">
        <TopBar today={data.today} screenTitle={title} />
        <main key={tab}>{screens[tab]}</main>
      </div>
      <TabBar active={tab} badges={{ nachkaufen: openRestock }} onSelect={setTab} />
    </div>
  );
}
