import { Droplets, Flame, Gauge } from "lucide-react";
import type { suppliedDays } from "@/lib/supply";
import { formatDecimal } from "../format";
import { Panel } from "../ui/Panel";
import { Ticker } from "../ui/Ticker";
import { MONO, cx } from "../theme";

interface EndurancePanelProps {
  supplied: ReturnType<typeof suppliedDays>;
  goalDays: number;
  overallPercent: number;
}

function DaysBar({ icon: Icon, label, days, goalDays }: { icon: typeof Flame; label: string; days: number; goalDays: number }) {
  const width = Math.min(days / goalDays, 1) * 100;
  return (
    <li data-reveal className="grid gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-zinc-300">
          <Icon className="size-3.5 text-zinc-500" /> {label}
        </span>
        <span className={cx(MONO, "text-xs text-zinc-400")}>
          {formatDecimal(days, 1)} / {goalDays} Tage
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.05]">
        <div data-bar className="h-full rounded-full bg-(--d2-accent) shadow-[0_0_10px_var(--d2-accent)]" style={{ width: `${width}%` }} />
      </div>
    </li>
  );
}

/** Erfüllungsgrad und durchhaltbare Tage, aufgeschlüsselt nach Energie und Wasser. */
export function EndurancePanel({ supplied, goalDays, overallPercent }: EndurancePanelProps) {
  return (
    <Panel label="Erfüllung & Durchhalten">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-zinc-500">Erfüllungsgrad</p>
          <p className="text-zinc-50">
            <Ticker value={overallPercent} className="text-4xl font-light" />
            <span className="text-zinc-500"> %</span>
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs text-zinc-500">
            <Gauge className="size-3" /> durchhaltbar
          </p>
          <p className="text-zinc-50">
            <Ticker value={supplied.days} decimals={1} className="text-4xl font-light" />
            <span className="text-zinc-500"> Tage</span>
          </p>
        </div>
      </div>
      <ul className="mt-4 grid gap-3">
        <DaysBar icon={Flame} label="Energie" days={supplied.energyDays} goalDays={goalDays} />
        <DaysBar icon={Droplets} label="Wasser" days={supplied.waterDays} goalDays={goalDays} />
      </ul>
    </Panel>
  );
}
