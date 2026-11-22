"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { whenMotionAllowed } from "../motion";
import { LABEL, cx } from "../theme";

interface ViewfinderProps {
  subject: string;
  hint: string;
  analyzing: boolean;
  shutterDisabled: boolean;
  onShutter: () => void;
}

const CORNERS = [
  "top-3 left-3 border-t-2 border-l-2 rounded-tl-lg",
  "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg",
  "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
  "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg",
];

/** Simulierter Kamera-Sucher mit Scan-Linie und Rahmen, der beim Analysieren zusammenzieht. */
export function Viewfinder({ subject, hint, analyzing, shutterDisabled, onShutter }: ViewfinderProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      whenMotionAllowed(frameRef, () => {
        gsap.fromTo("[data-scanline]", { yPercent: 0 }, {
          yPercent: 2800,
          duration: analyzing ? 0.6 : 2.4,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        if (analyzing) {
          gsap.to("[data-corner]", { scale: 0.86, duration: 0.45, ease: "power2.inOut", repeat: -1, yoyo: true });
        }
      });
    },
    { scope: frameRef, dependencies: [analyzing], revertOnUpdate: true },
  );

  return (
    <div data-reveal className="grid gap-3">
      <div ref={frameRef} className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_45%,#1a2328,#05080a_75%)]">
        <div aria-hidden className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "33.33% 33.33%" }} />
        <span aria-hidden className="absolute inset-0 grid place-items-center text-7xl opacity-80 blur-[1px] saturate-50">
          {subject}
        </span>
        {CORNERS.map((corner) => (
          <span key={corner} data-corner aria-hidden className={cx("absolute size-8 border-(--d2-accent) drop-shadow-[0_0_6px_var(--d2-accent)]", corner)} />
        ))}
        <span data-scanline aria-hidden className="absolute inset-x-6 top-[4%] h-[3%] bg-gradient-to-b from-transparent via-(--d2-accent)/70 to-transparent shadow-[0_0_18px_var(--d2-accent)]" />
        <p className={cx(LABEL, "absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2 py-0.5")}>
          {analyzing ? "analysiere …" : "● live"}
        </p>
        {hint && <p className="absolute inset-x-4 bottom-4 text-center text-xs text-zinc-300">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={onShutter}
        disabled={shutterDisabled || analyzing}
        aria-label="Foto aufnehmen"
        className="mx-auto grid size-16 place-items-center rounded-full border-2 border-(--d2-accent)/70 shadow-[0_0_24px_-4px_var(--d2-accent)] transition hover:scale-105 disabled:opacity-30 disabled:hover:scale-100"
      >
        <span className="size-12 rounded-full bg-(--d2-accent)/90" />
      </button>
    </div>
  );
}
