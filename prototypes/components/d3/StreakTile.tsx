import type { CheckIn } from "@/lib/types";
import { CountUp } from "./CountUp";
import { GlassTile } from "./GlassTile";
import { formatDayMonth } from "./stock";
import { LABEL } from "./styles";

interface StreakTileProps {
  checkIns: CheckIn[];
  streak: number;
}

export function StreakTile({ checkIns, streak }: StreakTileProps) {
  return (
    <GlassTile className="col-span-2">
      <span className={LABEL}>Check-in-Serie</span>
      <p className="mt-1 flex items-baseline gap-2">
        <CountUp value={streak} className="text-5xl font-extralight tracking-tight" />
        <span className="text-slate-500">Wochen in Folge</span>
      </p>
      <ol className="mt-4 flex items-end justify-between gap-1">
        {checkIns.map((checkIn) => (
          <li key={checkIn.date} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              title={checkIn.done ? "erledigt" : "ausgelassen"}
              className={`h-8 w-full max-w-7 rounded-full ${
                checkIn.done ? "bg-gradient-to-t from-indigo-300 to-violet-300" : "border border-dashed border-slate-300 bg-white/40"
              }`}
            />
            <span className="text-[10px] tabular-nums text-slate-500">{formatDayMonth(checkIn.date)}</span>
          </li>
        ))}
      </ol>
    </GlassTile>
  );
}
