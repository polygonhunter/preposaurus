import { Droplets } from "lucide-react";
import { formatAmount } from "@/lib/supply";
import { CountUp } from "./CountUp";
import { GlassTile } from "./GlassTile";
import { LABEL } from "./styles";
import type { LiveSupply } from "./use-live-supply";
import { WaterWave } from "./WaterWave";

export function WaterTile({ live }: { live: LiveSupply }) {
  const water = live.progressGoal.find((p) => p.key === "wasser");
  if (!water) return null;

  return (
    <GlassTile className="flex min-h-44 flex-col justify-between overflow-hidden">
      <WaterWave level={water.percent / 100} />
      <div className="relative flex items-center justify-between">
        <span className={LABEL}>Wasser</span>
        <Droplets size={16} className="text-sky-500" />
      </div>
      <div className="relative">
        <p className="text-4xl font-extralight tracking-tight">
          <CountUp value={water.percent} />
          <span className="text-lg text-slate-500"> %</span>
        </p>
        <p className="text-xs text-slate-600">
          {formatAmount(water.current, "ml")} von {formatAmount(Math.round(water.target), "ml")}
        </p>
      </div>
    </GlassTile>
  );
}
