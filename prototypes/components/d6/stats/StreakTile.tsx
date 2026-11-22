import { Check, Minus } from "lucide-react";
import type { CheckIn } from "@/lib/types";
import { formatDayMonth } from "../data/format";
import { MONO, cx } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";
import { Ticker } from "../ui/Ticker";

interface StreakTileProps {
  checkIns: CheckIn[];
  streak: number;
  checkedIn: boolean;
}

/** Check-in-Serie als Zeitleiste; die laufende Serie leuchtet. */
export function StreakTile({ checkIns, streak, checkedIn }: StreakTileProps) {
  const weeks = checkedIn ? [...checkIns, { date: "heute", done: true }] : checkIns;
  const streakStart = weeks.length - streak;

  return (
    <GlassTile label="Check-in-Serie" className="col-span-2">
      <p>
        <Ticker value={streak} className="text-5xl font-light tracking-tight" />
        <span className="text-(--d6-muted)"> Wochen in Folge</span>
      </p>
      <ol className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
        {weeks.map((week, i) => {
          const inStreak = i >= streakStart;
          return (
            <li key={week.date} className="grid justify-items-center gap-1">
              <span
                title={week.done ? "erledigt" : "ausgelassen"}
                className={cx(
                  "grid aspect-square w-full max-w-9 place-items-center rounded-xl border",
                  inStreak && "border-(--d6-accent)/50 bg-(--d6-accent-soft) text-(--d6-accent-text) shadow-[0_0_12px_-4px_var(--d6-glow)]",
                  !inStreak && week.done && "border-(--d6-line) text-(--d6-muted)",
                  !week.done && "border-dashed border-(--d6-subtle)/50 text-(--d6-subtle)",
                )}
              >
                {week.done ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}
              </span>
              <span className={`${MONO} text-[9px] text-(--d6-subtle)`}>{week.date === "heute" ? "heute" : formatDayMonth(week.date)}</span>
            </li>
          );
        })}
      </ol>
    </GlassTile>
  );
}
