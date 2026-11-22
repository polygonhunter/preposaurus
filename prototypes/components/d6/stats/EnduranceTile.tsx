import { Droplets, Flame, type LucideIcon } from "lucide-react";
import type { Goal } from "@/lib/types";
import { formatDayMonth, formatNumber } from "../data/format";
import type { LiveSupply } from "../data/use-cockpit";
import { LABEL, MONO } from "../theme/styles";
import { Gauge } from "../ui/Gauge";
import { GlassTile } from "../ui/GlassTile";
import { Ticker } from "../ui/Ticker";

interface DaysBarProps {
  icon: LucideIcon;
  label: string;
  days: number;
  goalDays: number;
}

function DaysBar({ icon: Icon, label, days, goalDays }: DaysBarProps) {
  return (
    <li className="grid gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5">
          <Icon className="size-3.5 text-(--d6-subtle)" /> {label}
        </span>
        <span className={`${MONO} text-xs text-(--d6-muted)`}>
          {formatNumber(days, 1)} / {goalDays} Tage
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-(--d6-track)">
        <div
          data-bar
          className="h-full rounded-full bg-(--d6-accent) shadow-[0_0_10px_var(--d6-glow)] transition-[width] duration-700"
          style={{ width: `${Math.min(days / goalDays, 1) * 100}%` }}
        />
      </div>
    </li>
  );
}

interface EnduranceTileProps {
  goal: Goal;
  live: LiveSupply;
}

/** Erfüllungsgrad als Instrument plus durchhaltbare Tage heute und am Zieldatum. */
export function EnduranceTile({ goal, live }: EnduranceTileProps) {
  const today = live.suppliedToday;

  return (
    <GlassTile label="Erfüllung & Durchhalten" className="col-span-2">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-4">
        <Gauge fraction={live.overallPercent / 100} className="max-w-[150px]">
          <div>
            <Ticker value={live.overallPercent} className="block text-3xl font-light" />
            <span className={LABEL}>% erfüllt</span>
          </div>
        </Gauge>
        <div className="space-y-3">
          <p>
            <span className={`${LABEL} block`}>durchhaltbar</span>
            <Ticker value={today.days} digits={1} className="text-4xl font-light tracking-tight" />
            <span className="text-sm text-(--d6-muted)"> Tage heute</span>
          </p>
          <p className="text-sm text-(--d6-muted)">
            <Ticker value={live.suppliedAtGoal.days} digits={1} className="font-semibold text-(--d6-text)" /> Tage am{" "}
            {formatDayMonth(goal.targetDate)}
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-3">
        <DaysBar icon={Flame} label="Energie" days={today.energyDays} goalDays={goal.days} />
        <DaysBar icon={Droplets} label="Wasser" days={today.waterDays} goalDays={goal.days} />
      </ul>
    </GlassTile>
  );
}
