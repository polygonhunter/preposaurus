import { Check, Minus } from "lucide-react";
import type { CheckIn } from "@/lib/types";
import { Panel } from "../ui/Panel";
import { Ticker } from "../ui/Ticker";
import { MONO, cx } from "../theme";

interface StreakPanelProps {
  checkIns: CheckIn[];
  streak: number;
}

/** Check-in-Serie als Zeitleiste; die aktuelle Serie leuchtet. */
export function StreakPanel({ checkIns, streak }: StreakPanelProps) {
  const streakStart = checkIns.length - streak;
  return (
    <Panel label="Check-in-Serie">
      <p className="text-zinc-50">
        <Ticker value={streak} className="text-4xl font-light" />
        <span className="text-zinc-400"> Wochen in Folge</span>
      </p>
      <ol className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${checkIns.length}, minmax(0, 1fr))` }}>
        {checkIns.map((checkIn, i) => {
          const inStreak = i >= streakStart;
          return (
            <li key={checkIn.date} data-reveal className="grid justify-items-center gap-1">
              <span
                className={cx(
                  "grid aspect-square w-full max-w-9 place-items-center rounded-lg border",
                  inStreak && "border-(--d2-accent)/50 bg-(--d2-accent-soft) text-(--d2-accent) shadow-[0_0_12px_-4px_var(--d2-accent)]",
                  !inStreak && checkIn.done && "border-white/10 text-zinc-400",
                  !checkIn.done && "border-dashed border-white/10 text-zinc-600",
                )}
                title={checkIn.done ? "erledigt" : "ausgelassen"}
              >
                {checkIn.done ? <Check className="size-3.5" /> : <Minus className="size-3.5" />}
              </span>
              <span className={cx(MONO, "text-[9px] text-zinc-600")}>{checkIn.date.slice(8, 10)}.{checkIn.date.slice(5, 7)}</span>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
