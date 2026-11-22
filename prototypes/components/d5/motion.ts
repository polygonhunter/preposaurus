import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);
// Bedingt gerenderte Elemente (z. B. Ergebnis-Karten) sollen keine Konsolen-Warnungen erzeugen.
gsap.config({ nullTargetWarn: false });

const MOTION_QUERIES = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
};

/**
 * Führt `animate` nur aus, wenn Bewegung erwünscht ist, sonst `still`.
 * Gibt eine Cleanup-Funktion zurück, die useGSAP beim Revert aufruft.
 */
export function onMotion(scope: Element | null, animate: () => void, still?: () => void) {
  const mm = gsap.matchMedia();
  mm.add(
    MOTION_QUERIES,
    (ctx) => {
      if (ctx.conditions?.motion) animate();
      else still?.();
    },
    scope ?? undefined,
  );
  return () => mm.revert();
}

/** Für einmaliges Feedback in Event-Handlern. */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOTION_QUERIES.reduce).matches;
}

/** Elastisches „Boing“ für ein Element nach einer Aktion. */
export function bounce(target: Element | null, strength = 0.88) {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(target, { scale: strength }, { scale: 1, duration: 0.7, ease: "elastic.out(1.1, 0.35)", overwrite: true });
}

export { gsap, useGSAP };
