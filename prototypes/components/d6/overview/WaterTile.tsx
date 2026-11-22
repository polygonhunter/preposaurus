import { Droplets } from "lucide-react";
import { formatAmount } from "@/lib/supply";
import type { LiveSupply } from "../data/use-cockpit";
import { LABEL, MONO } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";
import { Ticker } from "../ui/Ticker";
import { WaterWave } from "./WaterWave";

/** Wasser zum Zieldatum als Füllstand. */
export function WaterTile({ live }: { live: LiveSupply }) {
  const water = live.progressGoal.find((p) => p.key === "wasser");
  if (!water) return null;

  return (
    <GlassTile className="flex min-h-44 flex-col justify-between overflow-hidden">
      <WaterWave level={water.percent / 100} />
      <div className="flex items-center justify-between">
        <span className={LABEL}>Wasser</span>
        <Droplets size={16} className="text-(--d6-accent-text)" />
      </div>
      <div>
        <p>
          <Ticker value={water.percent} className="text-4xl font-light tracking-tight" />
          <span className="text-lg text-(--d6-muted)"> %</span>
        </p>
        <p className={`${MONO} text-[11px] text-(--d6-muted)`}>
          {formatAmount(water.current, "ml")} / {formatAmount(Math.round(water.target), "ml")}
        </p>
      </div>
    </GlassTile>
  );
}
