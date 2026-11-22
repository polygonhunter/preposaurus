"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";
import { MOTION_OK, isReducedMotion } from "./motion";

const WAVE_PATH = "M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V20 H0 Z";

interface WaterWaveProps {
  /** Füllstand 0–1 */
  level: number;
}

/** Wasser-Kachel als sich füllende, sanft wogende Welle. */
export function WaterWave({ level }: WaterWaveProps) {
  const scope = useRef<HTMLDivElement>(null);
  const height = `${Math.min(Math.max(level, 0), 1) * 100}%`;

  useGSAP(() => {
    const fill = scope.current?.querySelector("[data-water]");
    if (!fill) return;
    if (isReducedMotion()) gsap.set(fill, { height });
    else gsap.to(fill, { height, duration: 1.8, ease: "power2.out", overwrite: "auto" });
  }, { dependencies: [height], scope });

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.to("[data-wave='front']", { xPercent: -50, duration: 6, ease: "none", repeat: -1 });
      gsap.fromTo("[data-wave='back']", { xPercent: -50 }, { xPercent: 0, duration: 9, ease: "none", repeat: -1 });
    }, scope.current ?? undefined);
  }, { scope });

  return (
    <div ref={scope} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
      <div data-water className="absolute inset-x-0 bottom-0 h-0">
        <svg data-wave="back" viewBox="0 0 400 20" preserveAspectRatio="none" className="absolute bottom-full left-0 h-5 w-[200%] -mb-px">
          <path d={WAVE_PATH} className="fill-sky-200/70" />
        </svg>
        <svg data-wave="front" viewBox="0 0 400 20" preserveAspectRatio="none" className="absolute bottom-full left-0 h-4 w-[200%] -mb-px">
          <path d={WAVE_PATH} className="fill-sky-300/60" />
        </svg>
        <div className="h-full bg-gradient-to-b from-sky-300/60 to-sky-400/70" />
      </div>
    </div>
  );
}
