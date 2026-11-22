"use client";

import { useRef, type RefObject } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const MOTION_OK = "(prefers-reduced-motion: no-preference)";
const SCRAMBLE_PHASE = 0.3;

type Scope = RefObject<HTMLElement | SVGElement | null>;

/** Startet Animationen nur ohne „reduzierte Bewegung“. Wird vom umgebenden useGSAP-Kontext aufgeräumt. */
export function whenMotionAllowed(scope: Scope, animate: () => void) {
  gsap.matchMedia().add(MOTION_OK, animate, scope.current ?? undefined);
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Einstieg eines Screens: `[data-reveal]` gleitet gestaffelt ein, `[data-bar]` lädt sequenziell.
 * Ändern sich `dependencies` (z. B. ein Modus-Umschalter), läuft der Einstieg erneut.
 */
export function useScreenReveal(scope: Scope, dependencies: unknown[] = []) {
  useGSAP(
    () => {
      whenMotionAllowed(scope, () => {
        gsap.from("[data-reveal]", { y: 14, autoAlpha: 0, duration: 0.5, ease: "power3.out", stagger: 0.045 });
        gsap.from("[data-bar]", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.09,
          delay: 0.25,
        });
      });
    },
    { scope, dependencies, revertOnUpdate: true },
  );
}

function scrambleDigits(text: string): string {
  return text.replace(/\d/g, () => String(Math.floor(Math.random() * 10)));
}

/**
 * Zahl tickt vom zuletzt angezeigten Wert zum neuen; beim ersten Mal mit kurzem Scramble-Effekt.
 * `previous` wird erst nach Abschluss gesetzt, damit der StrictMode-Doppellauf die Animation nicht verschluckt.
 */
export function useTicker(ref: RefObject<HTMLElement | null>, value: number, format: (n: number) => string) {
  const previous = useRef<number | null>(null);
  useGSAP(
    () => {
      const node = ref.current?.firstChild;
      if (!node) return;
      const from = previous.current ?? 0;
      const scramble = previous.current === null;
      whenMotionAllowed(ref, () => {
        const state = { current: from };
        const tween = gsap.to(state, {
          current: value,
          duration: scramble ? 1.4 : 0.6,
          ease: "power2.out",
          onUpdate: () => {
            const text = format(state.current);
            node.nodeValue = scramble && tween.progress() < SCRAMBLE_PHASE ? scrambleDigits(text) : text;
          },
          onComplete: () => {
            node.nodeValue = format(value);
            previous.current = value;
          },
        });
      });
    },
    { dependencies: [value], revertOnUpdate: true },
  );
}

/** Kurzer Glow-Impuls als Feedback auf eine Aktion. */
export function useGlowPulse(scope: Scope) {
  const { contextSafe } = useGSAP({ scope });
  return contextSafe((target: Element | null) => {
    if (!target || prefersReducedMotion()) return;
    gsap.fromTo(
      target,
      { boxShadow: "0 0 0 1px rgba(62,230,255,0.9), 0 0 28px rgba(62,230,255,0.45)" },
      { boxShadow: "0 0 0 1px rgba(62,230,255,0), 0 0 0px rgba(62,230,255,0)", duration: 0.9, ease: "power2.out" },
    );
    gsap.fromTo(target, { scale: 0.98 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
  });
}

/** Zeitverzögerter Aufruf, der beim Unmount automatisch verworfen wird (z. B. simulierte Erkennung). */
export function useDelayedCall(scope: Scope) {
  const { contextSafe } = useGSAP({ scope });
  return contextSafe((seconds: number, callback: () => void) => {
    gsap.delayedCall(seconds, callback);
  });
}
