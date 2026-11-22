"use client";

import { useRef } from "react";
import type { CategoryProgress } from "@/lib/supply";
import { formatAmount } from "@/lib/supply";
import { getCategory } from "@/lib/categories";
import { gsap, useGSAP } from "./gsap";
import { isReducedMotion } from "./motion";

/** Skala bis 150 %, damit Überdeckung sichtbar bleibt. */
const SCALE_MAX = 150;
const toScale = (percent: number) => `${(Math.min(percent, SCALE_MAX) / SCALE_MAX) * 100}%`;

function barColor(percent: number): string {
  if (percent >= 100) return "from-emerald-300 to-emerald-400";
  if (percent >= 60) return "from-indigo-300 to-violet-400";
  return "from-amber-200 to-orange-300";
}

export function CategoryBar({ progress }: { progress: CategoryProgress }) {
  const scope = useRef<HTMLDivElement>(null);
  const { unit } = getCategory(progress.key);
  const base = toScale(Math.min(progress.percent, 100));
  const over = progress.percent > 100 ? toScale(progress.percent - 100) : "0%";

  useGSAP(() => {
    const vars = { duration: isReducedMotion() ? 0 : 1.2, ease: "power3.out", overwrite: "auto" as const };
    gsap.to("[data-bar='base']", { ...vars, width: base });
    gsap.to("[data-bar='over']", { ...vars, width: over, delay: isReducedMotion() ? 0 : 0.5 });
  }, { dependencies: [base, over], scope });

  return (
    <div ref={scope}>
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="truncate text-slate-700">
          <span aria-hidden className="mr-1.5">{progress.emoji}</span>
          {progress.label}
        </span>
        <span className="shrink-0 tabular-nums font-semibold text-slate-900">{progress.percent} %</span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-slate-900/[0.06]">
        <div data-bar="base" className={`absolute inset-y-0 left-0 w-0 rounded-full bg-gradient-to-r ${barColor(progress.percent)}`} />
        <div data-bar="over" style={{ left: toScale(100) }}
          className="absolute inset-y-0 w-0 rounded-r-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_12px] shadow-emerald-400/60" />
        <div aria-hidden style={{ left: toScale(100) }} className="absolute -top-1 h-4 w-px bg-slate-400/70" />
      </div>
      <p className="mt-1 text-[11px] text-slate-500 tabular-nums">
        {formatAmount(progress.current, unit)} von {formatAmount(Math.round(progress.target), unit)}
      </p>
    </div>
  );
}
