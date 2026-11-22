import { Droplets, Flame, Info, type LucideIcon } from "lucide-react";
import { MACRO_LABELS } from "@/lib/nutrition";
import { formatNumber } from "../data/format";
import type { LiveSupply } from "../data/use-cockpit";
import { GRID_LINES, LABEL, cx, readoutSurface } from "../theme/styles";
import { Gauge } from "../ui/Gauge";
import { GlassTile, TileOpenButton } from "../ui/GlassTile";
import { Ticker } from "../ui/Ticker";

interface ReadoutProps {
  icon: LucideIcon;
  label: string;
  days: number;
  limiting: boolean;
}

function Readout({ icon: Icon, label, days, limiting }: ReadoutProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border px-3 py-2",
        readoutSurface(limiting),
      )}
    >
      <p className={cx(LABEL, "flex items-center gap-1.5")}>
        <Icon className="size-3" /> {label}
      </p>
      <p className="mt-0.5">
        <Ticker value={days} digits={1} className="text-xl font-medium" /> <span className="text-xs text-(--d6-muted)">Tage</span>
      </p>
      <p className={cx("text-[11px] font-medium", limiting ? "text-(--d6-accent-text)" : "text-(--d6-subtle)")}>
        {limiting ? "Engpass" : "reicht länger"}
      </p>
    </div>
  );
}

interface GaugeTileProps {
  live: LiveSupply;
  goalDays: number;
  onOpen: (tile: HTMLElement | null) => void;
}

/** Hauptinstrument: heute versorgte Tage = Engpass aus Energie und Wasser. */
export function GaugeTile({ live, goalDays, onOpen }: GaugeTileProps) {
  const supplied = live.suppliedToday;
  const waterLimits = supplied.waterDays <= supplied.energyDays;

  return (
    <GlassTile
      flipId="tile-statistik"
      label="Heute versorgt"
      aside={<TileOpenButton label="Statistik öffnen" onOpen={onOpen} />}
      padding="p-5"
      className="col-span-2 md:row-span-2"
    >
      <div
        aria-hidden
        className={cx("absolute inset-0 -z-10 rounded-[28px] [mask-image:radial-gradient(circle_at_50%_40%,black,transparent_70%)]", GRID_LINES)}
      />
      <Gauge fraction={supplied.days / goalDays} className="max-w-[250px]">
        <div>
          <Ticker value={supplied.days} digits={1} className="block text-6xl font-light tracking-tight drop-shadow-[0_0_18px_var(--d6-glow)]" />
          <p className="mt-1 text-sm text-(--d6-muted)">Tage</p>
          <p className={cx(LABEL, "mt-2")}>Ziel {goalDays} Tage</p>
        </div>
      </Gauge>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Readout icon={Flame} label="Energie" days={supplied.energyDays} limiting={!waterLimits} />
        <Readout icon={Droplets} label="Wasser" days={supplied.waterDays} limiting={waterLimits} />
      </div>
      {live.macroGap && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-(--d6-track) px-3 py-2 text-xs leading-relaxed text-(--d6-muted)">
          <Info aria-hidden className="mt-0.5 size-3.5 shrink-0 text-(--d6-accent-text)" />
          <span>
            Energie reicht {formatNumber(supplied.energyDays, 1)} Tage, {MACRO_LABELS[live.macroGap.key].label} nur{" "}
            {formatNumber(live.macroGap.days, 1)}. Beim nächsten Einkauf einfach etwas darauf achten.
          </span>
        </p>
      )}
    </GlassTile>
  );
}
