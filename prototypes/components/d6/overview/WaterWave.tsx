"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "../motion/gsap";
import { MOTION_OK, prefersReducedMotion } from "../motion/motion";

const WAVE_PATH = "M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V20 H0 Z";

/** Wasser-Kachel als sich füllende, sanft wogende Welle (Design 3). `level` 0–1. */
export function WaterWave({ level }: { level: number }) {
  const scope = useRef<HTMLDivElement>(null);
  const height = `${Math.min(Math.max(level, 0), 1) * 100}%`;

  useGSAP(
    () => {
      const fill = scope.current?.querySelector("[data-water]");
      if (!fill) return;
      if (prefersReducedMotion()) gsap.set(fill, { height });
      else gsap.to(fill, { height, duration: 1.8, ease: "power2.out", overwrite: "auto" });
    },
    { dependencies: [height], scope },
  );

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.to("[data-wave='front']", { xPercent: -50, duration: 6, ease: "none", repeat: -1 });
        gsap.fromTo("[data-wave='back']", { xPercent: -50 }, { xPercent: 0, duration: 9, ease: "none", repeat: -1 });
      });
    },
    { scope },
  );

  return (
    <div ref={scope} aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[28px]">
      <div data-water className="absolute inset-x-0 bottom-0 h-0">
        <svg data-wave="back" viewBox="0 0 400 20" preserveAspectRatio="none" className="absolute bottom-full left-0 -mb-px h-5 w-[200%]">
          <path d={WAVE_PATH} fill="var(--d6-water)" />
        </svg>
        <svg data-wave="front" viewBox="0 0 400 20" preserveAspectRatio="none" className="absolute bottom-full left-0 -mb-px h-4 w-[200%]">
          <path d={WAVE_PATH} fill="var(--d6-water-deep)" />
        </svg>
        <div className="h-full bg-linear-to-b from-(--d6-water-deep) to-(--d6-water)" />
      </div>
    </div>
  );
}
