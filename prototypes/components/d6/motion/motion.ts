import { gsap } from "./gsap";

export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** Für einmalige Feedback-Animationen nach Klicks. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Screen-Einstieg: Glas-Kacheln bauen sich gestaffelt mit Blur auf (Design 3),
 * danach laden alle `[data-bar]` nacheinander wie Instrumente (Design 2).
 */
export function revealScreen(screen: Element, delay = 0) {
  const timeline = gsap.timeline({ delay });
  timeline.fromTo(
    screen.querySelectorAll("[data-tile]"),
    { autoAlpha: 0, scale: 0.95, y: 18, filter: "blur(14px)" },
    { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.9, ease: "expo.out", stagger: 0.06, clearProps: "filter,transform" },
  );
  const bars = screen.querySelectorAll("[data-bar]");
  if (bars.length > 0) {
    timeline.from(bars, { scaleX: 0, transformOrigin: "left center", duration: 0.7, ease: "power2.out", stagger: 0.05 }, 0.35);
  }
  return timeline;
}

/** Kurzes, federndes Bestätigungs-Feedback (z. B. Zähler nach „entnehmen“). */
export function popFeedback(target: Element | null) {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(target, { scale: 0.86 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" });
}

/** Glow-Impuls: eine `[data-glow]`-Ebene leuchtet auf und verglimmt (Design 2). */
export function flashGlow(target: Element | null | undefined) {
  if (!target || prefersReducedMotion()) return;
  gsap.fromTo(target, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.9, ease: "power2.out" });
}
