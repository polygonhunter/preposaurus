import { formatDate, type suppliedDays } from "@/lib/supply";
import type { Goal } from "@/lib/types";
import { Panel } from "../ui/Panel";
import { Ticker } from "../ui/Ticker";
import { MONO, cx } from "../theme";

interface GoalPanelProps {
  goal: Goal;
  atGoal: ReturnType<typeof suppliedDays>;
  overallPercent: number;
}

/** Ziel zum Stichtag als Segmentanzeige (ein Segment = ein Tag) plus Erfüllungsgrad. */
export function GoalPanel({ goal, atGoal, overallPercent }: GoalPanelProps) {
  const bottleneck = atGoal.waterDays <= atGoal.energyDays ? "Wasser" : "Energie";
  const goalLabel = formatDate(goal.targetDate).slice(0, 6);

  return (
    <Panel label={`Ziel ${goalLabel}`} aside={<span className={`${MONO} text-[11px] text-zinc-500`}>Engpass: {bottleneck}</span>}>
      <p className="text-zinc-100">
        <Ticker value={atGoal.days} decimals={1} className="text-3xl" />
        <span className="text-sm text-zinc-400"> von {goal.days} Tagen</span>
      </p>
      <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${goal.days}, minmax(0, 1fr))` }}>
        {Array.from({ length: goal.days }, (_, i) => {
          const fill = Math.min(Math.max(atGoal.days - i, 0), 1);
          return (
            <span key={i} className="relative h-6 overflow-hidden rounded-[5px] bg-white/[0.05]">
              <span
                data-bar
                className={cx("absolute inset-y-0 left-0 bg-(--d2-accent)", fill === 1 && "shadow-[0_0_10px_var(--d2-accent)]")}
                style={{ width: `${fill * 100}%` }}
              />
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex items-end justify-between border-t border-white/[0.06] pt-3">
        <span className="text-sm text-zinc-400">Erfüllungsgrad gesamt</span>
        <span className="text-zinc-50">
          <Ticker value={overallPercent} className="text-2xl" /> <span className="text-sm text-zinc-500">%</span>
        </span>
      </div>
    </Panel>
  );
}
