"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { whenMotionAllowed } from "../motion";

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SWEEP = 0.75;
const ARC = CIRCUMFERENCE * SWEEP;
const TICK_COUNT = 11;

interface GaugeProps {
  /** Füllung 0–1 (wird begrenzt) */
  fraction: number;
  children: ReactNode;
}

function Ticks() {
  return (
    <g stroke="currentColor" className="text-white/20">
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const angle = 135 + (270 / (TICK_COUNT - 1)) * i;
        return <line key={angle} x1="100" y1="4" x2="100" y2={i % 5 === 0 ? 14 : 10} transform={`rotate(${angle + 90} 100 100)`} />;
      })}
    </g>
  );
}

/** 270°-Rundinstrument, dessen Bogen sich beim Erscheinen aufzeichnet. */
export function Gauge({ fraction, children }: GaugeProps) {
  const arcRef = useRef<SVGCircleElement>(null);
  const previousOffset = useRef(ARC);
  const offset = ARC * (1 - Math.min(Math.max(fraction, 0), 1));

  useGSAP(
    () => {
      whenMotionAllowed(arcRef, () => {
        gsap.fromTo(
          arcRef.current,
          { strokeDashoffset: previousOffset.current },
          {
            strokeDashoffset: offset,
            duration: 1.6,
            ease: "power3.inOut",
            onComplete: () => {
              previousOffset.current = offset;
            },
          },
        );
      });
    },
    { dependencies: [offset], revertOnUpdate: true },
  );

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[240px]">
      <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
        <defs>
          <filter id="d2-gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <Ticks />
        <g transform="rotate(135 100 100)" fill="none" strokeWidth="10" strokeLinecap="round">
          <circle cx="100" cy="100" r={RADIUS} stroke="rgba(255,255,255,0.07)" strokeDasharray={`${ARC} ${CIRCUMFERENCE}`} />
          <circle
            ref={arcRef}
            cx="100"
            cy="100"
            r={RADIUS}
            stroke="var(--d2-accent)"
            filter="url(#d2-gauge-glow)"
            strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
            strokeDashoffset={offset}
          />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
