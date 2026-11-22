"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "../motion/gsap";
import { MOTION_OK } from "../motion/motion";
import { GRID_LINES, cx } from "../theme/styles";

/** Blob-Farben sind Tokens; per Maske statt Verlauf, damit der Theme-Wechsel weich überblenden kann. */
const BLOBS = [
  "left-[-20%] top-[-10%] bg-(--d6-blob-1)",
  "right-[-25%] top-[10%] bg-(--d6-blob-2)",
  "left-[-10%] bottom-[-15%] bg-(--d6-blob-3)",
  "right-[-15%] bottom-[5%] bg-(--d6-blob-4)",
];

/** Langsam wandernder Mesh-Verlauf (Design 3) mit feinem Instrumenten-Raster und Kopf-Glow (Design 2). */
export function MeshBackground() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
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
      });
    },
    { scope },
  );

  return (
    <div ref={scope} aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-(--d6-bg)">
      {BLOBS.map((position) => (
        <div
          key={position}
          data-blob
          className={cx("absolute size-[85vmax] rounded-full [mask-image:radial-gradient(circle,black_0%,transparent_65%)]", position)}
        />
      ))}
      <div className={cx("absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]", GRID_LINES)} />
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,var(--d6-accent-soft),transparent_70%)]" />
    </div>
  );
}
