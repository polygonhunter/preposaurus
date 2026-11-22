import { Panel } from "../ui/Panel";
import { Ticker } from "../ui/Ticker";
import { AMPEL_STYLE, LABEL, MONO } from "../theme";

interface WastePanelProps {
  consumedKg: number;
  wastedKg: number;
  takenThisSession: number;
}

/** Verbraucht vs. weggeworfen als geteilter Balken. */
export function WastePanel({ consumedKg, wastedKg, takenThisSession }: WastePanelProps) {
  const total = consumedKg + wastedKg;
  const usedShare = total > 0 ? (consumedKg / total) * 100 : 0;
  return (
    <Panel label="Verbraucht vs. weggeworfen">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={LABEL}>verbraucht</p>
          <p className="text-(--d2-surplus)">
            <Ticker value={consumedKg} decimals={1} className="text-3xl font-light" /> kg
          </p>
        </div>
        <div className="text-right">
          <p className={LABEL}>weggeworfen</p>
          <p style={{ color: AMPEL_STYLE.rot.color }}>
            <Ticker value={wastedKg} decimals={1} className="text-3xl font-light" /> kg
          </p>
        </div>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <div data-bar className="h-full bg-(--d2-surplus) shadow-[0_0_10px_var(--d2-surplus)]" style={{ width: `${usedShare}%` }} />
        <div className="h-full flex-1" style={{ background: AMPEL_STYLE.rot.color }} />
      </div>
      <p className={`${MONO} mt-2 text-[11px] text-zinc-500`}>
        {Math.round(usedShare)} % rechtzeitig genutzt · heute {takenThisSession} entnommen
      </p>
    </Panel>
  );
}
