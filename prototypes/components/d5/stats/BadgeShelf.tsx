"use client";

import type { CategoryProgress } from "@/lib/supply";
import { burstConfetti } from "../confetti";
import { bounce } from "../motion";
import { CARD, CATEGORY_TONE, TONES } from "../theme";

interface BadgeShelfProps {
  progress: CategoryProgress[];
}

/** Abzeichen je Warengruppe: erreicht = bunt und feierbar, sonst als Ziel mit Restprozent. */
export function BadgeShelf({ progress }: BadgeShelfProps) {
  const celebrate = (target: HTMLElement) => {
    bounce(target, 0.8);
    burstConfetti(target, 22);
  };

  return (
    <section data-pop className={`${CARD} p-4`}>
      <h2 className="mb-3 font-[family-name:var(--font-d5-display)] text-xl font-extrabold">Abzeichen</h2>
      <ul className="grid grid-cols-2 gap-2">
        {progress.map((p) => {
          const earned = p.percent >= 100;
          const tone = TONES[CATEGORY_TONE[p.key]];
          return (
            <li key={p.key}>
              <button
                type="button"
                disabled={!earned}
                onClick={(event) => celebrate(event.currentTarget)}
                className="flex w-full items-center gap-2 rounded-2xl border-2 p-2 text-left"
                style={
                  earned
                    ? { background: tone.fill, borderColor: tone.edge, color: tone.ink, boxShadow: `0 4px 0 ${tone.edge}` }
                    : { borderStyle: "dashed", borderColor: "var(--d5-line)", color: "var(--d5-muted)" }
                }
              >
                <span className={`text-2xl ${earned ? "" : "grayscale"}`} aria-hidden>
                  {earned ? "🏅" : p.emoji}
                </span>
                <span className="text-xs leading-tight font-black">
                  {earned ? `100 % ${p.label} erreicht` : `${p.label}: noch ${100 - p.percent} %`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
