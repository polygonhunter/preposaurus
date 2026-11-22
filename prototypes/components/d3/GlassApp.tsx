"use client";

import { useRef, useState } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { AddScreen } from "./AddScreen";
import { AppHeader } from "./AppHeader";
import { Flip, gsap, useGSAP } from "./gsap";
import { MeshBackground } from "./MeshBackground";
import { MOTION_OK, revealTiles } from "./motion";
import { OverviewScreen } from "./OverviewScreen";
import { RestockScreen } from "./RestockScreen";
import { StatsScreen } from "./StatsScreen";
import { addStock, takeEarliest, type StockDraft } from "./stock";
import { StockScreen } from "./StockScreen";
import { TabBar } from "./TabBar";
import { SCREEN_TITLES, type TabKey } from "./tabs";
import { useLiveSupply } from "./use-live-supply";

const FLIP_PROPS = "backgroundColor,borderRadius,boxShadow";

export function GlassApp({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<TabKey>("uebersicht");
  const [products, setProducts] = useState(data.products);
  const [restock, setRestock] = useState(data.restock);
  const [checkedIn, setCheckedIn] = useState(false);
  const [addCount, setAddCount] = useState(0);
  const live = useLiveSupply(data, products);
  const screenRef = useRef<HTMLDivElement>(null);
  const pendingFlip = useRef<Flip.FlipState | null>(null);

  /** Wechselt den Screen; mit Quell-Kachel wächst diese per Flip zum Vollbild. */
  const navigate = (next: TabKey, sourceTile?: HTMLElement | null) => {
    if (next === tab) return;
    pendingFlip.current = sourceTile ? Flip.getState(sourceTile, { props: FLIP_PROPS }) : null;
    setTab(next);
  };

  const addToStock = (draft: StockDraft) => {
    setProducts((prev) => addStock(prev, draft, addCount));
    setAddCount((n) => n + 1);
    navigate("vorrat");
  };

  const toggleRestock = (id: string) =>
    setRestock((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));

  useGSAP(() => {
    const screen = screenRef.current;
    const flipState = pendingFlip.current;
    pendingFlip.current = null;
    if (!screen) return;
    window.scrollTo({ top: 0 });
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const tiles = screen.querySelectorAll("[data-tile]");
      if (flipState) {
        Flip.from(flipState, { targets: screen, props: FLIP_PROPS, scale: true, duration: 0.7, ease: "expo.inOut" });
        revealTiles(tiles, 0.45);
      } else {
        revealTiles(tiles);
      }
    });
  }, { dependencies: [tab], revertOnUpdate: true });

  return (
    <div className="relative isolate min-h-dvh text-slate-900">
      <MeshBackground />
      <div className="mx-auto w-full max-w-[460px] px-4 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))] md:max-w-3xl md:pt-12">
        <AppHeader title={SCREEN_TITLES[tab]} today={data.today} members={data.members} />
        <main key={tab} ref={screenRef} data-flip-id={`tile-${tab}`} className="rounded-[32px]">
          {tab === "uebersicht" && <OverviewScreen data={data} live={live} restock={restock} onNavigate={navigate} />}
          {tab === "vorrat" && (
            <StockScreen products={products} today={data.today}
              onTake={(id) => setProducts((prev) => takeEarliest(prev, id))} />
          )}
          {tab === "hinzufuegen" && <AddScreen sample={data.products[0]} today={data.today} onAdd={addToStock} />}
          {tab === "statistik" && (
            <StatsScreen data={data} live={live} checkedIn={checkedIn}
              onCheckIn={() => setCheckedIn(true)} onOpenStock={() => navigate("vorrat")} />
          )}
          {tab === "nachkaufen" && <RestockScreen items={restock} onToggle={toggleRestock} />}
        </main>
      </div>
      <TabBar active={tab} onChange={(next) => navigate(next)} />
    </div>
  );
}
