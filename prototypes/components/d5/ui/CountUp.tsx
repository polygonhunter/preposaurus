"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../motion";

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

function format(value: number, decimals: number) {
  return value.toLocaleString("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Zählt eine Zahl hoch (und bei Änderungen weich zum neuen Wert). */
export function CountUp({ value, decimals = 0, suffix = "", className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef({ value: 0 });

  useGSAP(
    () => {
      const element = ref.current;
      if (!element) return;
      const render = () => {
        element.textContent = `${format(shown.current.value, decimals)}${suffix}`;
      };
      if (prefersReducedMotion()) {
        shown.current.value = value;
        render();
        return;
      }
      gsap.to(shown.current, { value, duration: 1.2, ease: "power3.out", onUpdate: render, overwrite: true });
    },
    { dependencies: [value, decimals, suffix] },
  );

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {`${format(value, decimals)}${suffix}`}
    </span>
  );
}
