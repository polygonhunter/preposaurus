import type { Goal } from "@/lib/types";
import { formatDayMonth, formatNumber } from "../data/format";
import type { LiveSupply } from "../data/use-cockpit";
import { LABEL, MONO } from "../theme/styles";
import { EditLink } from "../ui/EditLink";
import { GlassTile } from "../ui/GlassTile";
import { SegmentBar } from "../ui/SegmentBar";
import { Ticker } from "../ui/Ticker";

interface GoalTileProps {
  goal: Goal;
  live: LiveSupply;
  onEdit: (tile: HTMLElement | null) => void;
}

/** Stand zum Zieldatum (nur was dann noch haltbar ist) als 10-Segment-Leiste plus Erfüllungsgrad. */
export function GoalTile({ goal, live, onEdit }: GoalTileProps) {
  const atGoal = live.suppliedAtGoal;
  const bottleneck = atGoal.waterDays <= atGoal.energyDays ? "Wasser" : "Energie";

  return (
    <GlassTile
      flipId="tile-einstellungen"
      label={`Ziel ${formatDayMonth(goal.targetDate)}`}
      aside={<span className={LABEL}>Engpass: <span className="text-(--d6-accent-text)">{bottleneck}</span></span>}
      className="col-span-2"
    >
      <p>
        <Ticker value={atGoal.days} digits={1} className="text-4xl font-light tracking-tight" />
        <span className="text-sm text-(--d6-muted)"> von {goal.days} Tagen</span>
      </p>
      <div className="mt-3">
        <SegmentBar value={atGoal.days} total={goal.days} />
      </div>
      <p className={`${MONO} mt-2 text-[11px] text-(--d6-subtle)`}>
        Energie {formatNumber(atGoal.energyDays, 1)} T. · Wasser {formatNumber(atGoal.waterDays, 1)} T.
      </p>
      <div className="mt-4 flex items-end justify-between border-t border-(--d6-line) pt-3">
        <span className="text-sm text-(--d6-muted)">Erfüllungsgrad gesamt</span>
        <span>
          <Ticker value={live.overallPercent} className="text-2xl font-medium" />
          <span className="text-sm text-(--d6-muted)"> %</span>
        </span>
      </div>
      <div className="-mb-1 mt-2 flex justify-end">
        <EditLink label="Ziel & Empfehlung in den Einstellungen bearbeiten" onEdit={onEdit} />
      </div>
    </GlassTile>
  );
}
