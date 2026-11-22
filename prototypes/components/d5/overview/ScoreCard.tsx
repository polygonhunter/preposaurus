import { CountUp } from "../ui/CountUp";
import { OverflowBar } from "../ui/OverflowBar";

interface ScoreCardProps {
  overallPercent: number;
  badgeCount: number;
}

function cheer(percent: number): string {
  if (percent >= 100) return "Wow, alles im Glas! 🎉";
  if (percent >= 70) return "Fast geschafft, weiter so!";
  if (percent >= 40) return "Gute Basis – Schritt für Schritt.";
  return "Jedes Glas zählt. Los geht’s!";
}

/** Gesamter Erfüllungsgrad als bunte Punktekarte. */
export function ScoreCard({ overallPercent, badgeCount }: ScoreCardProps) {
  return (
    <section
      data-pop
      className="rounded-3xl bg-[#9B6BFF] p-4 text-white shadow-[0_6px_0_#7444E0]"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-extrabold opacity-85">Erfüllungsgrad gesamt</p>
          <p className="font-[family-name:var(--font-d5-display)] text-5xl leading-none font-extrabold">
            <CountUp value={overallPercent} suffix=" %" />
          </p>
        </div>
        <div className="rounded-2xl bg-white/20 px-3 py-2 text-center">
          <p className="text-2xl" aria-hidden>
            🏅
          </p>
          <p className="text-xs font-black">{badgeCount} Abzeichen</p>
        </div>
      </div>
      <div className="mt-3 rounded-full bg-white/25 p-0.5">
        <OverflowBar percent={overallPercent} tone="yellow" />
      </div>
      <p className="mt-2 text-sm font-bold">{cheer(overallPercent)}</p>
    </section>
  );
}
