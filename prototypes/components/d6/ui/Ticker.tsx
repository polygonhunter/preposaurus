"use client";

import { useRef } from "react";
import { formatNumber } from "../data/format";
import { useTicker } from "../motion/hooks";
import { MONO, cx } from "../theme/styles";

interface TickerProps {
  value: number;
  digits?: number;
  className?: string;
}

/** Monospace-Zahl, die beim Erscheinen scrambelt und bei Änderungen weich tickt. */
export function Ticker({ value, digits = 0, className }: TickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useTicker(ref, value, (n) => formatNumber(n, digits));
  return (
    <span ref={ref} className={cx(MONO, className)}>
      {formatNumber(value, digits)}
    </span>
  );
}
