"use client";

import { useRef } from "react";
import { Flip, gsap, useGSAP } from "./gsap";
import { MOTION_OK, revealScreen } from "./motion";

const FLIP_PROPS = "backgroundColor,borderRadius,boxShadow";

/**
 * Screen-Wechsel: Mit Quell-Element (Kachel, Zahnrad) wächst dieses per Flip zum Vollbild,
 * danach bauen sich die Kacheln gestaffelt auf. `capture` vor dem State-Wechsel aufrufen.
 */
export function useScreenFlip(screenKey: string) {
  const screenRef = useRef<HTMLElement>(null);
  const pendingFlip = useRef<Flip.FlipState | null>(null);

  const capture = (source?: HTMLElement | null) => {
    pendingFlip.current = source ? Flip.getState(source, { props: FLIP_PROPS }) : null;
  };

  useGSAP(
    () => {
      const screen = screenRef.current;
      const flipState = pendingFlip.current;
      pendingFlip.current = null;
      if (!screen) return;
      window.scrollTo({ top: 0 });
      gsap.matchMedia().add(MOTION_OK, () => {
        if (flipState) {
          Flip.from(flipState, { targets: screen, props: FLIP_PROPS, scale: true, duration: 0.7, ease: "expo.inOut" });
        }
        revealScreen(screen, flipState ? 0.45 : 0);
      });
    },
    { dependencies: [screenKey], revertOnUpdate: true },
  );

  return { screenRef, capture };
}
