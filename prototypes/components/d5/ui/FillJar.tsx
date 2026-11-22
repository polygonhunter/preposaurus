"use client";

import { useId, useRef } from "react";
import { gsap, onMotion, prefersReducedMotion, useGSAP } from "../motion";
import { TONES, type Tone } from "../theme";

interface FillJarProps {
  percent: number;
  tone: Tone;
  shape?: "jar" | "tank";
  className?: string;
}

const BODY = { jar: { top: 20, bottom: 120 }, tank: { top: 12, bottom: 120 } };
const WAVE_PERIOD = 50;

/** Sinus-ähnliche Welle aus quadratischen Kurven, breit genug für eine Endlos-Schleife. */
function wavePath(amplitude: number): string {
  let d = "M -100 0";
  for (let x = -100; x < 150; x += WAVE_PERIOD) {
    d += ` Q ${x + 12.5} ${-amplitude} ${x + 25} 0 T ${x + WAVE_PERIOD} 0`;
  }
  return `${d} L 150 140 L -100 140 Z`;
}

const FRONT_WAVE = wavePath(5);
const BACK_WAVE = wavePath(7);

/** Vorratsglas bzw. Wassertank, das sich mit einer wogenden Welle füllt. */
export function FillJar({ percent, tone, shape = "jar", className = "" }: FillJarProps) {
  const scope = useRef<HTMLDivElement>(null);
  const level = useRef<SVGGElement>(null);
  const clipId = `jar-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const { fill, edge } = TONES[tone];
  const { top, bottom } = BODY[shape];
  const levelY = bottom - ((bottom - top) * Math.min(Math.max(percent, 0), 100)) / 100;

  useGSAP(
    () =>
      onMotion(scope.current, () => {
        gsap.to(".wave-front", { x: -WAVE_PERIOD, duration: 2.2, ease: "none", repeat: -1 });
        gsap.fromTo(".wave-back", { x: -WAVE_PERIOD }, { x: 0, duration: 3.4, ease: "none", repeat: -1 });
      }),
    { scope },
  );

  useGSAP(
    () => {
      const reduced = prefersReducedMotion();
      gsap.to(level.current, {
        y: levelY,
        duration: reduced ? 0 : 1.8,
        ease: "elastic.out(1, 0.45)",
        overwrite: true,
      });
    },
    { scope, dependencies: [levelY] },
  );

  const body =
    shape === "jar" ? (
      <rect x="8" y={top} width="84" height={bottom - top} rx="22" />
    ) : (
      <rect x="6" y={top} width="88" height={bottom - top} rx="28" />
    );

  return (
    <div ref={scope} className={`relative ${className}`}>
      <svg viewBox="0 0 100 124" className="h-full w-full overflow-visible" role="img" aria-label={`${percent} Prozent gefüllt`}>
        <defs>
          <clipPath id={clipId}>{body}</clipPath>
        </defs>
        {shape === "jar" ? (
          <rect x="20" y="4" width="60" height="14" rx="6" fill={edge} />
        ) : (
          <rect x="38" y="0" width="24" height="12" rx="5" fill={edge} />
        )}
        <g clipPath={`url(#${clipId})`}>
          <rect x="0" y="0" width="100" height="124" fill={fill} opacity="0.14" />
          <g ref={level} transform={`translate(0 ${bottom + 8})`}>
            <path className="wave-back" d={BACK_WAVE} fill={edge} opacity="0.45" />
            <path className="wave-front" d={FRONT_WAVE} fill={fill} />
          </g>
          <rect x="16" y={top + 12} width="9" height={(bottom - top) * 0.55} rx="4.5" fill="#fff" opacity="0.55" />
        </g>
        <g fill="none" stroke={edge} strokeWidth="4">
          {body}
        </g>
      </svg>
    </div>
  );
}
