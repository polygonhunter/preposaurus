import { ChevronRight } from "lucide-react";
import { formatDate, type ExpiringUnit } from "@/lib/supply";
import { AmpelDot } from "../ui/AmpelDot";
import { Panel } from "../ui/Panel";
import { MONO } from "../theme";

interface ExpiringPanelProps {
  expiring: ExpiringUnit[];
  targetDate: string;
  onOpenStock: () => void;
}

function daysLabel(daysLeft: number): string {
  if (daysLeft < 0) return `seit ${-daysLeft} T.`;
  return `in ${daysLeft} T.`;
}

/** Einheiten, deren MHD vor dem Zieldatum liegt – freundlich als „zuerst verbrauchen“. */
export function ExpiringPanel({ expiring, targetDate, onOpenStock }: ExpiringPanelProps) {
  const beforeGoal = expiring.filter((e) => e.unit.mhd < targetDate);
  return (
    <Panel
      label="Läuft vor Zieldatum ab"
      aside={
        <button type="button" onClick={onOpenStock} className="flex items-center text-xs text-(--d2-accent) hover:underline">
          Zum Vorrat <ChevronRight className="size-3.5" />
        </button>
      }
    >
      {beforeGoal.length === 0 ? (
        <p className="text-sm text-zinc-400">Alles hält bis zum Zieldatum.</p>
      ) : (
        <ul className="divide-y divide-white/[0.05]">
          {beforeGoal.map(({ product, unit, ampel, daysLeft }) => (
            <li data-reveal key={unit.id} className="flex items-center gap-3 py-2 text-sm">
              <AmpelDot ampel={ampel} />
              <span className="flex-1 truncate text-zinc-200">{product.name}</span>
              <span className={`${MONO} text-xs text-zinc-500`}>{formatDate(unit.mhd)}</span>
              <span className={`${MONO} w-16 text-right text-xs text-zinc-400`}>{daysLabel(daysLeft)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.
      </p>
    </Panel>
  );
}
