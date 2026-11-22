"use client";

import { useRef } from "react";
import { formatDate } from "@/lib/supply";
import type { CheckIn } from "@/lib/types";
import { gsap, onMotion, useGSAP } from "../motion";
import { CARD } from "../theme";

interface StreakFlamesProps {
  checkIns: CheckIn[];
  streak: number;
}

const WEEK_MS = 7 * 86_400_000;

function nextCheckIn(checkIns: CheckIn[]): string | null {
  const last = checkIns.at(-1);
  return last ? formatDate(new Date(Date.parse(last.date) + WEEK_MS).toISOString()) : null;
}

/** Wöchentliche Check-ins als Flammen-Reihe; die aktuelle Serie lodert. */
export function StreakFlames({ checkIns, streak }: StreakFlamesProps) {
  const scope = useRef<HTMLElement>(null);
  const streakStart = checkIns.length - streak;
  const next = nextCheckIn(checkIns);

  useGSAP(
    () =>
      onMotion(scope.current, () => {
        gsap.from(".flame-cell", { y: 30, scale: 0, duration: 0.6, stagger: 0.07, ease: "back.out(3)" });
        gsap.to(".flame-live", {
          scaleY: 1.18,
          scaleX: 0.9,
          transformOrigin: "50% 100%",
          duration: 0.4,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          stagger: { each: 0.12, from: "end" },
        });
      }),
    { scope },
  );

  return (
    <section ref={scope} data-pop className={`${CARD} p-4`}>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-[family-name:var(--font-d5-display)] text-xl font-extrabold">Check-in-Serie</h2>
        <p className="font-black text-[#D97A1E]">🔥 {streak} Wochen</p>
      </div>
      <ol className="flex justify-between gap-1">
        {checkIns.map((checkIn, index) => {
          const live = index >= streakStart && checkIn.done;
          return (
            <li key={checkIn.date} className="flame-cell flex flex-col items-center gap-1">
              <span
                className={`grid size-9 place-items-center rounded-full text-xl ${checkIn.done ? "bg-[#FFF0DD]" : "bg-(--d5-soft) grayscale opacity-50"}`}
                aria-label={checkIn.done ? "erledigt" : "ausgelassen"}
              >
                <span className={live ? "flame-live inline-block" : "inline-block"}>{checkIn.done ? "🔥" : "💤"}</span>
              </span>
              <span className="text-[10px] font-bold text-(--d5-muted)">
                {new Date(checkIn.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-bold text-(--d5-muted)">
        Ein kurzer Blick pro Woche hält den Vorrat frisch.{next && ` Nächster Check-in: ${next}.`}
      </p>
    </section>
  );
}
