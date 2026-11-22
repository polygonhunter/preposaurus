"use client";

import { useRef, useState } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { AddScreen } from "./add/AddScreen";
import { gsap, onMotion, useGSAP } from "./motion";
import { OverviewScreen } from "./overview/OverviewScreen";
import { RestockScreen } from "./restock/RestockScreen";
import { StatsScreen } from "./stats/StatsScreen";
import { StockScreen } from "./stock/StockScreen";
import { TabBar } from "./TabBar";
import { TABS, type TabKey } from "./tabs";
import { THEME_VARS } from "./theme";
import { TopBar } from "./TopBar";
import { useLiveSupply } from "./useLiveSupply";
import { useStock } from "./useStock";

interface PlayfulAppProps {
  data: DashboardData;
  fontClassName: string;
}

const tabIndex = (tab: TabKey) => TABS.findIndex((t) => t.key === tab);

/** App-Rahmen: hält den lokalen State und animiert die Tab-Wechsel. */
export function PlayfulApp({ data, fontClassName }: PlayfulAppProps) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [direction, setDirection] = useState(1);
  const stock = useStock(data.products, data.restock);
  const live = useLiveSupply(data, stock.products);
  const main = useRef<HTMLElement>(null);

  const selectTab = (next: TabKey) => {
    setDirection(tabIndex(next) >= tabIndex(tab) ? 1 : -1);
    setTab(next);
  };

  useGSAP(
    () =>
      onMotion(main.current, () => {
        gsap.from(".d5-screen", { x: 60 * direction, rotation: 2 * direction, opacity: 0, duration: 0.55, ease: "back.out(1.7)" });
        gsap.from("[data-pop]", { y: 24, scale: 0.85, opacity: 0, duration: 0.6, stagger: 0.06, delay: 0.1, ease: "back.out(2.2)" });
      }),
    { scope: main, dependencies: [tab], revertOnUpdate: true },
  );

  return (
    <div style={THEME_VARS} className={`${fontClassName} min-h-dvh bg-[#FFE3B3] text-(--d5-ink) sm:py-8`}>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-x-clip bg-(--d5-bg) font-[family-name:var(--font-d5-body)] sm:min-h-[calc(100dvh-4rem)] sm:rounded-[2.5rem] sm:border-4 sm:border-(--d5-ink) sm:shadow-[0_10px_0_var(--d5-ink)]">
        <TopBar streak={live.streak} level={live.badges.length + 1} />
        <main ref={main} className="flex-1 px-4 pb-8">
          <div key={tab} className="d5-screen">
            {tab === "overview" && <OverviewScreen data={data} live={live} />}
            {tab === "stock" && <StockScreen products={stock.products} today={data.today} onTakeOne={stock.takeOne} />}
            {tab === "add" && (
              <AddScreen
                template={data.products[0]}
                today={data.today}
                onAdd={stock.addProduct}
                onDone={() => selectTab("stock")}
              />
            )}
            {tab === "stats" && <StatsScreen data={data} live={live} />}
            {tab === "restock" && <RestockScreen items={stock.restock} onToggle={stock.toggleRestock} />}
          </div>
        </main>
        <TabBar active={tab} onSelect={selectTab} />
      </div>
    </div>
  );
}
