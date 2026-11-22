"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import { gsap, onMotion, prefersReducedMotion, useGSAP } from "../motion";
import { ChunkyButton } from "../ui/ChunkyButton";

interface ViewfinderProps {
  subject: string;
  hint: string;
  shootLabel: string;
  busy: boolean;
  onShoot: () => void;
}

const CORNERS = [
  "left-4 top-4 border-l-[6px] border-t-[6px] rounded-tl-2xl",
  "right-4 top-4 border-r-[6px] border-t-[6px] rounded-tr-2xl",
  "left-4 bottom-4 border-l-[6px] border-b-[6px] rounded-bl-2xl",
  "right-4 bottom-4 border-r-[6px] border-b-[6px] rounded-br-2xl",
];

/** Simulierte Live-Kamera mit atmendem Sucher-Rahmen, Scan-Linie und Blitz. */
export function Viewfinder({ subject, hint, shootLabel, busy, onShoot }: ViewfinderProps) {
  const scope = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(
    () =>
      onMotion(scope.current, () => {
        gsap.to(".corner", { scale: 0.88, duration: 0.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap.fromTo(".scanline", { top: "12%" }, { top: "84%", duration: 1.6, yoyo: true, repeat: -1, ease: "sine.inOut" });
        gsap.to(".subject", { y: -6, rotation: -4, duration: 1.3, yoyo: true, repeat: -1, ease: "sine.inOut" });
      }),
    { scope },
  );

  const shoot = contextSafe(() => {
    onShoot();
    if (prefersReducedMotion()) return;
    gsap.fromTo(".flash", { opacity: 0.9 }, { opacity: 0, duration: 0.5, ease: "power2.out" });
  });

  return (
    <div ref={scope} className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#2B2850] shadow-[0_6px_0_#1A1836]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#4A4580_0,#2B2850_70%)]" />
        {CORNERS.map((position) => (
          <span key={position} aria-hidden className={`corner absolute size-12 border-[#FFC93C] ${position}`} />
        ))}
        <span aria-hidden className="scanline absolute inset-x-8 top-1/2 h-1 rounded-full bg-[#4CC66A] shadow-[0_0_16px_#4CC66A]" />
        <span aria-hidden className="subject absolute inset-0 grid place-items-center text-7xl">
          {subject}
        </span>
        <span className="absolute inset-x-0 bottom-3 text-center text-sm font-extrabold text-white/90">
          {busy ? "Ich schaue genau hin … 🔍" : hint}
        </span>
        <span aria-hidden className="flash pointer-events-none absolute inset-0 bg-white opacity-0" />
      </div>
      <ChunkyButton tone="blue" size="lg" onClick={shoot} disabled={busy}>
        <Camera className="size-6" strokeWidth={3} />
        {shootLabel}
      </ChunkyButton>
    </div>
  );
}
