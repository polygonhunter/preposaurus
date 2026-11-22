"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "../motion/gsap";
import { MOTION_OK } from "../motion/motion";
import { LABEL, cx } from "../theme/styles";

const CORNERS = [
  "left-4 top-4 rounded-tl-2xl border-l-2 border-t-2",
  "right-4 top-4 rounded-tr-2xl border-r-2 border-t-2",
  "bottom-4 left-4 rounded-bl-2xl border-b-2 border-l-2",
  "bottom-4 right-4 rounded-br-2xl border-b-2 border-r-2",
];

const CAMERA_GRID =
  "bg-[linear-gradient(rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.06)_1px,transparent_1px)] bg-[size:33.34%_33.34%]";

interface ViewfinderProps {
  subject: string;
  hint: string;
  analyzing: boolean;
  shutterDisabled: boolean;
  onShutter: () => void;
}

/** Simulierte Live-Kamera: Drittel-Raster, leuchtende Scan-Linie, Rahmen zieht sich beim Analysieren zusammen. */
export function Viewfinder({ subject, hint, analyzing, shutterDisabled, onShutter }: ViewfinderProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo(
          "[data-scanline]",
          { top: "10%" },
          { top: "86%", duration: analyzing ? 0.55 : 2.4, ease: "sine.inOut", repeat: -1, yoyo: true },
        );
        gsap.to("[data-subject]", { y: -5, rotate: -2, duration: 2.4, ease: "sine.inOut", repeat: -1, yoyo: true });
        gsap.to("[data-corner]", {
          scale: analyzing ? 0.84 : 0.93,
          duration: analyzing ? 0.4 : 1.2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      });
    },
    { scope: frameRef, dependencies: [analyzing], revertOnUpdate: true },
  );

  return (
    <div className="grid gap-3">
      <div
        ref={frameRef}
        className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-(--d6-line) bg-[radial-gradient(circle_at_50%_45%,#273341,#070b10_75%)]"
      >
        <div aria-hidden className={cx("absolute inset-0", CAMERA_GRID)} />
        <span data-subject aria-hidden className="absolute inset-0 grid place-items-center text-7xl drop-shadow-2xl">
          {subject}
        </span>
        {CORNERS.map((corner) => (
          <span key={corner} data-corner aria-hidden className={cx("absolute size-9 border-(--d6-scan) drop-shadow-[0_0_6px_var(--d6-scan)]", corner)} />
        ))}
        <span
          data-scanline
          aria-hidden
          className="absolute inset-x-7 top-[10%] h-0.5 rounded-full bg-(--d6-scan) shadow-[0_0_16px_4px_var(--d6-scan)]"
        />
        <p className={cx(LABEL, "absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-0.5 text-white/85")}>
          {analyzing ? "analysiere …" : "● live"}
        </p>
        {hint && (
          <p className="absolute inset-x-3 bottom-3 rounded-2xl bg-black/45 px-3 py-2 text-center text-xs text-white backdrop-blur-md">{hint}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onShutter}
        disabled={shutterDisabled || analyzing}
        aria-label="Foto aufnehmen"
        className="mx-auto grid size-16 place-items-center rounded-full border-2 border-(--d6-accent) shadow-[0_0_24px_-4px_var(--d6-glow)] transition hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
      >
        <span className="size-12 rounded-full bg-(--d6-accent)" />
      </button>
    </div>
  );
}
