import type { DashboardData } from "@/lib/dashboard-data";
import { CountUp } from "./CountUp";
import { GlassTile, TileOpenButton } from "./GlassTile";
import { formatDayMonth, formatNumber } from "./stock";
import { LABEL } from "./styles";
import type { LiveSupply } from "./use-live-supply";

interface SupplyHeroTileProps {
  goal: DashboardData["goal"];
  live: LiveSupply;
  onOpen: (tile: HTMLElement | null) => void;
}

/** Hauptkachel: heute versorgte Tage und Stand zum Zieldatum. */
export function SupplyHeroTile({ goal, live, onOpen }: SupplyHeroTileProps) {
  const atGoal = live.suppliedAtGoal;
  const waterIsBottleneck = atGoal.waterDays <= atGoal.energyDays;
  const goalShare = Math.min(atGoal.days / goal.days, 1) * 100;

  return (
    <GlassTile flipId="tile-statistik" className="col-span-2 p-5">
      <div className="flex items-start justify-between">
        <span className={LABEL}>Heute versorgt</span>
        <TileOpenButton label="Statistik öffnen" onOpen={onOpen} />
      </div>
      <p className="mt-1 flex items-baseline gap-2">
        <CountUp value={live.suppliedToday.days} digits={1} className="text-[68px] font-extralight leading-none tracking-tight" />
        <span className="text-xl font-light text-slate-500">Tage</span>
      </p>

      <div className="mt-5 rounded-2xl bg-white/60 p-3.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-600">Ziel {formatDayMonth(goal.targetDate)}</span>
          <span className="tabular-nums">
            <strong className="font-semibold">{formatNumber(atGoal.days, 1)}</strong>
            <span className="text-slate-500"> von {goal.days} Tagen</span>
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-900/[0.06]">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-violet-400" style={{ width: `${goalShare}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Engpass: <span className="font-medium text-slate-700">{waterIsBottleneck ? "Wasser" : "Energie"}</span>
          {" · "}Energie {formatNumber(atGoal.energyDays, 1)} T. · Wasser {formatNumber(atGoal.waterDays, 1)} T.
        </p>
      </div>
    </GlassTile>
  );
}
