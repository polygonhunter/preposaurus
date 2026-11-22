"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";
import { MOTION_OK } from "./motion";

const BLOBS = [
  "left-[-20%] top-[-10%] bg-[radial-gradient(circle,#ffd6e0_0%,transparent_65%)]",
  "right-[-25%] top-[10%] bg-[radial-gradient(circle,#d7d4ff_0%,transparent_65%)]",
  "left-[-10%] bottom-[-15%] bg-[radial-gradient(circle,#c9f2e3_0%,transparent_65%)]",
  "right-[-15%] bottom-[5%] bg-[radial-gradient(circle,#cfe8ff_0%,transparent_65%)]",
];

/** Weicher Pastell-Mesh-Verlauf, der sich sehr langsam bewegt. */
export function MeshBackground() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.utils.toArray<HTMLElement>("[data-blob]").forEach((blob, index) => {
        gsap.to(blob, {
          x: "random(-140, 140)",
          y: "random(-120, 120)",
          scale: "random(0.85, 1.2)",
          duration: 16 + index * 3,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          repeatRefresh: true,
        });
      });
    }, scope.current ?? undefined);
  }, { scope });

  return (
    <div ref={scope} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f5f4fa]">
      {BLOBS.map((position) => (
        <div key={position} data-blob className={`absolute size-[85vmax] rounded-full opacity-90 ${position}`} />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(transparent_0%,rgba(245,244,250,0.5)_80%)]" />
    </div>
  );
}
