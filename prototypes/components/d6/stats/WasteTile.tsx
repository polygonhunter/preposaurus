import type { DashboardData } from "@/lib/dashboard-data";
import type { HistoryEntry } from "@/lib/unit-history";
import { LABEL, MONO } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";
import { Ticker } from "../ui/Ticker";

interface WasteTileProps {
  waste: DashboardData["waste"];
  /** in dieser Sitzung verbraucht/entsorgt */
  history: HistoryEntry[];
}

/** Verbraucht vs. weggeworfen als geteilter Balken. */
export function WasteTile({ waste, history }: WasteTileProps) {
  const consumed = history.filter((h) => h.outcome === "verbraucht").length;
  const discarded = history.length - consumed;
  const total = waste.consumedKg + waste.wastedKg;
  const usedShare = total > 0 ? (waste.consumedKg / total) * 100 : 0;

  return (
    <GlassTile label="Verbraucht vs. weggeworfen" className="col-span-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={LABEL}>verbraucht</p>
          <p className="text-(--d6-surplus-text)">
            <Ticker value={waste.consumedKg} digits={1} className="text-3xl font-light" /> kg
          </p>
        </div>
        <div className="text-right">
          <p className={LABEL}>weggeworfen</p>
          <p className="text-(--d6-expired-text)">
            <Ticker value={waste.wastedKg} digits={1} className="text-3xl font-light" /> kg
          </p>
        </div>
      </div>
      <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-(--d6-expired)">
        <div data-bar className="h-full rounded-full bg-(--d6-surplus) shadow-[0_0_10px_var(--d6-surplus)]" style={{ width: `${usedShare}%` }} />
      </div>
      <p className={`${MONO} mt-2 text-[11px] text-(--d6-muted)`}>
        {Math.round(usedShare)} % rechtzeitig genutzt · heute {consumed} verbraucht · {discarded} entsorgt
      </p>
    </GlassTile>
  );
}
