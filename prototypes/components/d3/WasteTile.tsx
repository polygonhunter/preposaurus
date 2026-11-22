import type { DashboardData } from "@/lib/dashboard-data";
import { GlassTile } from "./GlassTile";
import { formatNumber } from "./stock";
import { LABEL } from "./styles";

export function WasteTile({ waste }: { waste: DashboardData["waste"] }) {
  const total = waste.consumedKg + waste.wastedKg;
  const consumedShare = total > 0 ? (waste.consumedKg / total) * 100 : 0;

  return (
    <GlassTile className="col-span-2">
      <span className={LABEL}>Verbraucht vs. weggeworfen</span>
      <div className="mt-3 flex items-end justify-between">
        <p>
          <span className="text-4xl font-extralight tracking-tight tabular-nums">{formatNumber(waste.consumedKg, 1)}</span>
          <span className="text-slate-500"> kg gegessen</span>
        </p>
        <p className="text-right text-sm text-slate-500 tabular-nums">{formatNumber(waste.wastedKg, 1)} kg weggeworfen</p>
      </div>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-rose-300/80">
        <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-400" style={{ width: `${consumedShare}%` }} />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        {formatNumber(consumedShare)} % rechtzeitig verbraucht – der Vorrat lebt.
      </p>
    </GlassTile>
  );
}
