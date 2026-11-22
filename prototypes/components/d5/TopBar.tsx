"use client";

import { useRef } from "react";
import { gsap, onMotion, useGSAP } from "./motion";
import { toneVars } from "./theme";

interface TopBarProps {
  streak: number;
  level: number;
}

/** Kopfzeile mit Maskottchen, Flammen-Serie und Level. */
export function TopBar({ streak, level }: TopBarProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () =>
      onMotion(scope.current, () => {
        gsap.to(".flame", { scaleY: 1.15, scaleX: 0.92, transformOrigin: "50% 100%", duration: 0.35, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap.to(".mascot", { rotation: 8, duration: 0.9, yoyo: true, repeat: -1, ease: "sine.inOut", transformOrigin: "50% 90%" });
      }),
    { scope },
  );

  return (
    <header ref={scope} className="sticky top-0 z-30 flex items-center justify-between bg-(--d5-bg)/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <span className="mascot inline-block text-3xl" aria-hidden>
          🐿️
        </span>
        <span className="font-[family-name:var(--font-d5-display)] text-xl font-extrabold tracking-tight">Preposaurus</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          style={toneVars("orange")}
          className="flex items-center gap-1 rounded-full border-2 border-(--tone) bg-white px-2.5 py-0.5 font-black text-(--tone-edge)"
          aria-label={`${streak} Check-ins in Folge`}
        >
          <span className="flame inline-block" aria-hidden>
            🔥
          </span>
          {streak}
        </span>
        <span
          style={toneVars("purple")}
          className="rounded-full bg-(--tone) px-2.5 py-0.5 text-sm font-black text-white shadow-[0_3px_0_var(--tone-edge)]"
        >
          Lv {level}
        </span>
      </div>
    </header>
  );
}
