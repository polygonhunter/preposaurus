import { CARD } from "../theme";
import { CountUp } from "../ui/CountUp";
import { OverflowBar } from "../ui/OverflowBar";

interface WasteCompareProps {
  consumedKg: number;
  wastedKg: number;
}

/** Verbraucht vs. weggeworfen – mit Lob statt Mahnfinger. */
export function WasteCompare({ consumedKg, wastedKg }: WasteCompareProps) {
  const total = consumedKg + wastedKg;
  const usedPercent = total > 0 ? Math.round((consumedKg / total) * 100) : 0;

  return (
    <section data-pop className={`${CARD} p-4`}>
      <h2 className="mb-3 font-[family-name:var(--font-d5-display)] text-xl font-extrabold">Verbraucht vs. weggeworfen</h2>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#EAFBEF] p-3 text-center">
          <p className="text-3xl" aria-hidden>
            😋
          </p>
          <p className="text-2xl font-black text-[#2F9E4C]">
            <CountUp value={consumedKg} decimals={1} suffix=" kg" />
          </p>
          <p className="text-xs font-bold text-(--d5-muted)">aufgegessen</p>
        </div>
        <div className="rounded-2xl bg-[#FFF0F0] p-3 text-center">
          <p className="text-3xl" aria-hidden>
            🗑️
          </p>
          <p className="text-2xl font-black text-[#D63A40]">
            <CountUp value={wastedKg} decimals={1} suffix=" kg" />
          </p>
          <p className="text-xs font-bold text-(--d5-muted)">weggeworfen</p>
        </div>
      </div>
      <div className="mt-3 space-y-1">
        <OverflowBar percent={usedPercent} tone="green" scaleMax={100} />
        <p className="text-sm font-bold">
          {usedPercent} % rechtzeitig genutzt – richtig gut rotiert! ♻️
        </p>
      </div>
    </section>
  );
}
