"use client";

import { useRef } from "react";
import { ScanLine } from "lucide-react";
import { gsap, useGSAP } from "./gsap";
import { MOTION_OK, isReducedMotion } from "./motion";

const SCAN_SECONDS = 1.3;
const CORNERS = [
  "left-4 top-4 border-l-2 border-t-2 rounded-tl-2xl",
  "right-4 top-4 border-r-2 border-t-2 rounded-tr-2xl",
  "left-4 bottom-4 border-l-2 border-b-2 rounded-bl-2xl",
  "right-4 bottom-4 border-r-2 border-b-2 rounded-br-2xl",
];

interface ViewfinderProps {
  emoji: string;
  caption: string;
  scanning: boolean;
  /** Wechselt bei jedem neuen Scan-Vorgang. */
  scanKey: number;
  onDetected: () => void;
}

/** Simulierte Live-Kamera mit atmendem Sucher-Rahmen und Scanlinie. */
export function Viewfinder({ emoji, caption, scanning, scanKey, onDetected }: ViewfinderProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.to("[data-corner]", { scale: 0.92, duration: 1.2, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to("[data-subject]", { y: -4, rotate: -2, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true });
    }, scope.current ?? undefined);
  }, { scope });

  useGSAP(() => {
    if (!scanning) return;
    gsap.delayedCall(SCAN_SECONDS, onDetected);
    if (isReducedMotion()) return;
    gsap.fromTo("[data-scanline]", { top: "12%", autoAlpha: 1 }, { top: "84%", duration: SCAN_SECONDS / 2, ease: "sine.inOut", repeat: 1, yoyo: true });
  }, { dependencies: [scanKey, scanning], scope });

  return (
    <div ref={scope} className="relative aspect-[4/3] overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.18),transparent_60%)]" />
      {CORNERS.map((corner) => (
        <span key={corner} data-corner className={`absolute size-10 border-white/90 ${corner}`} />
      ))}
      <span data-subject aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl drop-shadow-2xl">
        {emoji}
      </span>
      <span data-scanline className={`absolute inset-x-8 h-0.5 rounded-full bg-sky-300 shadow-[0_0_16px_4px] shadow-sky-300/60 ${scanning ? "" : "invisible"}`} />
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-2xl bg-black/35 px-3 py-2 text-xs text-white backdrop-blur-md">
        <ScanLine size={14} className={scanning ? "animate-pulse" : ""} />
        <span className="truncate">{scanning ? "Suche …" : caption}</span>
      </div>
    </div>
  );
}
