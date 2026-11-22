import { Droplets, Flame } from "lucide-react";
import type { suppliedDays } from "@/lib/supply";
import { Gauge } from "../ui/Gauge";
import { Panel } from "../ui/Panel";
import { Ticker } from "../ui/Ticker";
import { LABEL, cx } from "../theme";

type Supplied = ReturnType<typeof suppliedDays>;

interface SupplyGaugePanelProps {
  supplied: Supplied;
  goalDays: number;
}

function Readout({ icon: Icon, label, days, limiting }: { icon: typeof Flame; label: string; days: number; limiting: boolean }) {
  return (
    <div
      className={cx(
        "rounded-xl border px-3 py-2",
        limiting ? "border-(--d2-accent)/40 bg-(--d2-accent-soft)" : "border-white/[0.07]",
      )}
    >
      <p className={cx(LABEL, "flex items-center gap-1.5")}>
        <Icon className="size-3" /> {label}
      </p>
      <p className="mt-1 text-zinc-100">
        <Ticker value={days} decimals={1} className="text-xl" /> <span className="text-xs text-zinc-500">Tage</span>
      </p>
      {limiting && <p className="text-[11px] text-(--d2-accent)">Engpass</p>}
    </div>
  );
}

/** Hauptinstrument: heute versorgte Tage, gemessen am Engpass aus Energie und Wasser. */
export function SupplyGaugePanel({ supplied, goalDays }: SupplyGaugePanelProps) {
  const waterLimits = supplied.waterDays <= supplied.energyDays;
  return (
    <Panel label="Heute versorgt">
      <Gauge fraction={supplied.days / goalDays}>
        <div>
          <Ticker value={supplied.days} decimals={1} className="block text-6xl font-light text-zinc-50 drop-shadow-[0_0_18px_rgba(62,230,255,0.45)]" />
          <p className="mt-1 text-sm text-zinc-400">Tage</p>
          <p className={cx(LABEL, "mt-2")}>Ziel {goalDays} Tage</p>
        </div>
      </Gauge>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Readout icon={Flame} label="Energie" days={supplied.energyDays} limiting={!waterLimits} />
        <Readout icon={Droplets} label="Wasser" days={supplied.waterDays} limiting={waterLimits} />
      </div>
    </Panel>
  );
}
