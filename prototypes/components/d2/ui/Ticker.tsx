"use client";

import { useRef } from "react";
import { formatDecimal } from "../format";
import { useTicker } from "../motion";
import { MONO, cx } from "../theme";

interface TickerProps {
  value: number;
  decimals?: number;
  className?: string;
}

/** Zahl, die beim Erscheinen und bei Änderungen hoch- bzw. runtertickt. */
export function Ticker({ value, decimals = 0, className }: TickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  useTicker(ref, value, (n) => formatDecimal(n, decimals));
  return (
    <span ref={ref} className={cx(MONO, className)}>
      {formatDecimal(value, decimals)}
    </span>
  );
}
