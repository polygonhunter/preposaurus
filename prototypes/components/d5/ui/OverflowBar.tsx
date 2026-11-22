"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../motion";
import { toneVars, type Tone } from "../theme";

interface OverflowBarProps {
  percent: number;
  tone: Tone;
  /** Skalen-Ende in %; bei 100 entfällt die Ziel-Markierung */
  scaleMax?: 100 | 150;
}

/** Balken mit sichtbarer 100-%-Marke; Überschuss über 100 % wird gestreift gezeigt. */
export function OverflowBar({ percent, tone, scaleMax = 150 }: OverflowBarProps) {
  const scope = useRef<HTMLDivElement>(null);
  const width = (Math.min(percent, scaleMax) / scaleMax) * 100;
  const goalMark = (100 / scaleMax) * 100;

  useGSAP(
    () => {
      gsap.to(".bar-fill", {
        width: `${width}%`,
        duration: prefersReducedMotion() ? 0 : 1.1,
        ease: "back.out(1.6)",
      });
    },
    { scope, dependencies: [width] },
  );

  return (
    <div ref={scope} style={toneVars(tone)} className="relative h-3 w-full rounded-full bg-(--d5-soft)">
      <div
        className="bar-fill h-full w-0 rounded-full bg-(--tone)"
        style={
          percent > 100
            ? { backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 5px, rgba(255,255,255,.35) 5px 10px)" }
            : undefined
        }
      />
      {scaleMax > 100 && (
        <span
          aria-hidden
          className="absolute -top-1 h-5 w-1 rounded-full bg-(--d5-ink) opacity-60"
          style={{ left: `${goalMark}%` }}
        />
      )}
    </div>
  );
}
