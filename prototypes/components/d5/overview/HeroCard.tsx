import type { Goal } from "@/lib/types";
import { formatDate } from "@/lib/supply";
import { CARD } from "../theme";
import { CountUp } from "../ui/CountUp";
import { FillJar } from "../ui/FillJar";
import type { LiveSupply } from "../useLiveSupply";

interface HeroCardProps {
  goal: Goal;
  suppliedToday: LiveSupply["suppliedToday"];
  suppliedAtGoal: LiveSupply["suppliedAtGoal"];
}

function bottleneck({ energyDays, waterDays }: LiveSupply["suppliedToday"]) {
  return waterDays <= energyDays ? { emoji: "💧", label: "Wasser", days: waterDays } : { emoji: "⚡", label: "Energie", days: energyDays };
}

/** Großer Wassertank: wie viele Tage der Haushalt heute versorgt ist. */
export function HeroCard({ goal, suppliedToday, suppliedAtGoal }: HeroCardProps) {
  const percentOfGoal = Math.round((suppliedToday.days / goal.days) * 100);
  const limit = bottleneck(suppliedAtGoal);
  const goalLabel = formatDate(goal.targetDate).slice(0, 6);

  return (
    <section data-pop className={`${CARD} flex items-center gap-4 p-4`}>
      <FillJar percent={percentOfGoal} tone="blue" shape="tank" className="h-36 w-28 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-(--d5-muted)">Heute versorgt</p>
        <p className="font-[family-name:var(--font-d5-display)] text-5xl leading-none font-extrabold text-[#1F86D0]">
          <CountUp value={suppliedToday.days} decimals={1} />
          <span className="ml-1 text-2xl">Tage</span>
        </p>
        <p className="mt-3 rounded-2xl bg-(--d5-soft) px-3 py-2 text-sm font-bold leading-snug">
          🎯 Ziel {goalLabel}:{" "}
          <strong className="font-black">
            {suppliedAtGoal.days.toLocaleString("de-DE")} von {goal.days} Tagen
          </strong>
          <span className="mt-0.5 block text-xs text-(--d5-muted)">
            Engpass: {limit.emoji} {limit.label} ({limit.days.toLocaleString("de-DE")} Tage)
          </span>
        </p>
      </div>
    </section>
  );
}
