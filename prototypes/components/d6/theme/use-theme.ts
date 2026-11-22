"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { prefersReducedMotion } from "../motion/motion";
import { ROOT_ID, applyTheme, currentTheme, initialTheme, storeTheme, type Theme } from "./theme";

function subscribe(onChange: () => void) {
  const root = document.getElementById(ROOT_ID);
  if (!root) return () => {};
  const observer = new MutationObserver(onChange);
  observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const serverTheme = (): Theme => "light";

/** Aktuelles Farbschema (aus `data-theme`) und Umschalten mit weichem Überblenden. */
export function useTheme() {
  // Bei Client-Navigation lief das Inline-Script nicht: Schema vor dem Paint nachziehen.
  useLayoutEffect(() => applyTheme(initialTheme(), false), []);
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme);

  const setTheme = (next: Theme) => {
    storeTheme(next);
    applyTheme(next, !prefersReducedMotion());
  };

  return { theme, setTheme };
}

export type ThemeState = ReturnType<typeof useTheme>;
