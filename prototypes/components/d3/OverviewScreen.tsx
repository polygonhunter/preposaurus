import { Camera, ShoppingBasket } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard-data";
import type { RestockItem } from "@/lib/types";
import { CategoryTile } from "./CategoryTile";
import { ExpiringTile } from "./ExpiringTile";
import { MembersTile } from "./MembersTile";
import { OverallTile } from "./OverallTile";
import { QuickTile } from "./QuickTile";
import { SupplyHeroTile } from "./SupplyHeroTile";
import type { TabKey } from "./tabs";
import type { LiveSupply } from "./use-live-supply";
import { WaterTile } from "./WaterTile";

interface OverviewScreenProps {
  data: DashboardData;
  live: LiveSupply;
  restock: RestockItem[];
  onNavigate: (tab: TabKey, source?: HTMLElement | null) => void;
}

export function OverviewScreen({ data, live, restock, onNavigate }: OverviewScreenProps) {
  const openItems = restock.filter((item) => !item.done).length;
  const open = (tab: TabKey) => (tile: HTMLElement | null) => onNavigate(tab, tile);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <SupplyHeroTile goal={data.goal} live={live} onOpen={open("statistik")} />
      <OverallTile percent={live.overallPercent} />
      <WaterTile live={live} />
      <CategoryTile live={live} targetDate={data.goal.targetDate} onOpen={open("vorrat")} />
      <ExpiringTile live={live} targetDate={data.goal.targetDate} onOpen={open("vorrat")} />
      <QuickTile flipId="tile-hinzufuegen" icon={Camera} title="Foto aufnehmen" detail="Packung & MHD erkennen" onOpen={open("hinzufuegen")} />
      <QuickTile flipId="tile-nachkaufen" icon={ShoppingBasket} title="Nachkaufen" detail={`${openItems} offen`} onOpen={open("nachkaufen")} />
      <MembersTile members={data.members} />
    </div>
  );
}
