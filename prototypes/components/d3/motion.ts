import { useRef } from "react";
import { Flip, gsap, useGSAP } from "./gsap";

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Für einmalige Feedback-Animationen nach Klicks. */
export function isReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Kacheln bauen sich weich auf: Scale + Blur-in, gestaffelt. */
export function revealTiles(tiles: Element[] | NodeListOf<Element>, delay = 0) {
  return gsap.fromTo(
    tiles,
    { autoAlpha: 0, scale: 0.94, y: 18, filter: "blur(14px)" },
    {
      autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)",
      duration: 0.9, ease: "expo.out", stagger: 0.06, delay,
      clearProps: "filter,transform",
    },
  );
}

/** Kurzes, federndes Bestätigungs-Feedback (z. B. nach „entnehmen“). */
export function popFeedback(target: Element | null) {
  if (!target || isReducedMotion()) return;
  gsap.fromTo(target, { scale: 0.86 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" });
}

/** Magnetischer Hover: Element folgt dem Zeiger ein Stück. */
export function useMagnetic<T extends HTMLElement>(strength = 0.18) {
  const ref = useRef<T>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el || strength === 0) return;
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and (hover: hover)`, () => {
      const moveX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
      const moveY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
      const onMove = (event: PointerEvent) => {
        const box = el.getBoundingClientRect();
        moveX((event.clientX - box.left - box.width / 2) * strength);
        moveY((event.clientY - box.top - box.height / 2) * strength);
      };
      const onLeave = () => {
        moveX(0);
        moveY(0);
      };
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);
      return () => {
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    });
  }, { dependencies: [strength], scope: ref });
  return ref;
}

/** Aktiver „Pill“-Hintergrund gleitet per Flip zur neuen Auswahl. */
export function useFlipPill<T>(active: T) {
  const scope = useRef<HTMLDivElement>(null);
  const pending = useRef<Flip.FlipState | null>(null);

  const capture = () => {
    const pill = scope.current?.querySelector("[data-pill]");
    if (pill) pending.current = Flip.getState(pill);
  };

  useGSAP(() => {
    const state = pending.current;
    pending.current = null;
    const pill = scope.current?.querySelector("[data-pill]");
    if (!state || !pill || isReducedMotion()) return;
    Flip.from(state, { targets: pill, duration: 0.55, ease: "back.out(1.3)" });
  }, { dependencies: [active], scope });

  return { scope, capture };
}
