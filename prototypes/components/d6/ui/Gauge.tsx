"use client";

import { useId, useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "../motion/gsap";
import { MOTION_OK } from "../motion/motion";
import { cx } from "../theme/styles";

const RADIUS = 84;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC = CIRCUMFERENCE * 0.75;
const TICK_COUNT = 11;

interface GaugeProps {
  /** Füllung 0–1 (wird begrenzt) */
  fraction: number;
  children: ReactNode;
  className?: string;
}

function Ticks() {
  return (
    <g stroke="var(--d6-subtle)" strokeOpacity="0.45" strokeLinecap="round">
      {Array.from({ length: TICK_COUNT }, (_, i) => {
        const angle = 135 + (270 / (TICK_COUNT - 1)) * i;
        return <line key={angle} x1="100" y1="3" x2="100" y2={i % 5 === 0 ? 13 : 9} transform={`rotate(${angle + 90} 100 100)`} />;
      })}
    </g>
  );
}

/** 270°-Rundinstrument mit Glow (Design 2); der Bogen zeichnet sich vom letzten Wert aus neu. */
export function Gauge({ fraction, children, className }: GaugeProps) {
  const arcRef = useRef<SVGCircleElement>(null);
  const previousOffset = useRef(ARC);
  const gradientId = `d6-gauge-${useId().replace(/[^\w-]/g, "")}`;
  const offset = ARC * (1 - Math.min(Math.max(fraction, 0), 1));

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
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
    <div className={cx("relative mx-auto aspect-square w-full", className)}>
      <svg viewBox="0 0 200 200" className="size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="1" y2="0">
            <stop offset="0%" style={{ stopColor: "var(--d6-accent-2)" }} />
            <stop offset="100%" style={{ stopColor: "var(--d6-accent)" }} />
          </linearGradient>
        </defs>
        <Ticks />
        <g transform="rotate(135 100 100)" fill="none" strokeWidth="11" strokeLinecap="round">
          <circle cx="100" cy="100" r={RADIUS} stroke="var(--d6-track)" strokeDasharray={`${ARC} ${CIRCUMFERENCE}`} />
          <circle
            ref={arcRef}
            cx="100"
            cy="100"
            r={RADIUS}
            stroke={`url(#${gradientId})`}
            strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
            strokeDashoffset={offset}
            style={{ filter: "drop-shadow(0 0 7px var(--d6-glow))" }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
