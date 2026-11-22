"use client";

import { useRef, type RefObject } from "react";
import { Flip, gsap, useGSAP } from "./gsap";
import { MOTION_OK, prefersReducedMotion } from "./motion";

const SCRAMBLE_PHASE = 0.3;

function scrambleDigits(text: string): string {
  return text.replace(/\d/g, () => String(Math.floor(Math.random() * 10)));
}

/**
 * Zahl tickt vom zuletzt gezeigten Wert zum neuen; beim ersten Mal mit kurzem Ziffern-Scramble (Design 2).
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
      gsap.matchMedia().add(MOTION_OK, () => {
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

/**
 * Merkt sich die Lage aller `selector`-Elemente vor einer Änderung (`capture`)
 * und lässt sie danach per Flip an die neue Position gleiten (Design 3).
 */
export function useFlipLayout<T extends HTMLElement>(selector: string, dependencies: unknown[], vars: Flip.FromToVars = {}) {
  const scope = useRef<T>(null);
  const pending = useRef<Flip.FlipState | null>(null);

  const capture = () => {
    const elements = scope.current?.querySelectorAll(selector);
    if (elements && elements.length > 0) pending.current = Flip.getState(elements);
  };

  useGSAP(
    () => {
      const state = pending.current;
      pending.current = null;
      const elements = scope.current?.querySelectorAll(selector);
      if (!state || !elements || prefersReducedMotion()) return;
      Flip.from(state, { targets: elements, duration: 0.6, ease: "power3.inOut", ...vars });
    },
    { dependencies, scope },
  );

  return { scope, capture };
}

/** Aktive Markierung („Pill“) gleitet per Flip zur neuen Auswahl. */
export function useFlipPill<T extends HTMLElement>(active: string) {
  return useFlipLayout<T>("[data-pill]", [active], { duration: 0.55, ease: "back.out(1.3)" });
}

/** Zeitverzögerter Aufruf, der beim Unmount automatisch verworfen wird (simulierte Erkennung). */
export function useDelayedCall(scope: RefObject<HTMLElement | null>) {
  const { contextSafe } = useGSAP({ scope });
  return contextSafe((seconds: number, callback: () => void) => {
    gsap.delayedCall(seconds, callback);
  });
}
