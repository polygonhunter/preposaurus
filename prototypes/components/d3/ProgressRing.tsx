"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "./gsap";
import { isReducedMotion } from "./motion";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface ProgressRingProps {
  percent: number;
  size?: number;
  children?: ReactNode;
}

export function ProgressRing({ percent, size = 112, children }: ProgressRingProps) {
  const scope = useRef<HTMLDivElement>(null);
  const offset = CIRCUMFERENCE * (1 - Math.min(percent, 100) / 100);

  useGSAP(() => {
    gsap.to("[data-ring]", {
      strokeDashoffset: offset,
      duration: isReducedMotion() ? 0 : 1.6,
      ease: "power3.out",
      overwrite: "auto",
    });
  }, { dependencies: [offset], scope });

  return (
    <div ref={scope} className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="d3-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#a5b4fc" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="8" className="stroke-slate-900/[0.06]" />
        <circle data-ring cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke="url(#d3-ring)" strokeDasharray={CIRCUMFERENCE} strokeDashoffset={CIRCUMFERENCE} />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  );
}
