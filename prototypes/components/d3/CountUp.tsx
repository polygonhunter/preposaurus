"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";
import { isReducedMotion } from "./motion";
import { formatNumber } from "./stock";

interface CountUpProps {
  value: number;
  digits?: number;
  className?: string;
}

/** Zahl, die weich zu ihrem neuen Wert zählt. */
export function CountUp({ value, digits = 0, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const counter = useRef({ current: 0 });

  useGSAP(() => {
    const textNode = ref.current?.firstChild;
    if (!textNode) return;
    const render = () => {
      textNode.nodeValue = formatNumber(counter.current.current, digits);
    };
    if (isReducedMotion()) {
      counter.current.current = value;
      render();
      return;
    }
    gsap.to(counter.current, { current: value, duration: 1.4, ease: "power3.out", overwrite: "auto", onUpdate: render });
  }, { dependencies: [value, digits] });

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {formatNumber(value, digits)}
    </span>
  );
}
