"use client";

import { useRef } from "react";
import type { CategoryProgress } from "@/lib/supply";
import { formatAmount } from "@/lib/supply";
import { getCategory } from "@/lib/categories";
import { burstConfetti } from "../confetti";
import { bounce } from "../motion";
import { CATEGORY_TONE, TONES } from "../theme";
import { FillJar } from "../ui/FillJar";
import { OverflowBar } from "../ui/OverflowBar";

/** Ein Vorratsglas je Warengruppe – antippen lässt es hüpfen, volle Gläser feiern. */
export function JarTile({ progress }: { progress: CategoryProgress }) {
  const tile = useRef<HTMLButtonElement>(null);
  const tone = CATEGORY_TONE[progress.key];
  const unit = getCategory(progress.key).unit;
  const reached = progress.percent >= 100;

  const celebrate = () => {
    bounce(tile.current, 0.85);
    if (reached) burstConfetti(tile.current, 18);
  };

  return (
    <button
      ref={tile}
      type="button"
      onClick={celebrate}
      data-pop
      className="relative flex flex-col items-center gap-1.5 rounded-3xl border-2 border-(--d5-line) bg-white p-3 text-center shadow-[0_4px_0_var(--d5-line)]"
    >
      {reached && (
        <span className="absolute -top-2 -right-1 rotate-12 text-2xl" aria-label="Ziel erreicht">
          🏅
        </span>
      )}
      <div className="relative">
        <FillJar percent={progress.percent} tone={tone} className="h-20 w-16" />
        <span className="absolute inset-0 grid place-items-center pt-3 text-2xl" aria-hidden>
          {progress.emoji}
        </span>
      </div>
      <span className="line-clamp-1 text-xs font-extrabold">{progress.label}</span>
      <span className="font-[family-name:var(--font-d5-display)] text-lg leading-none font-extrabold" style={{ color: TONES[tone].edge }}>
        {progress.percent} %
      </span>
      <OverflowBar percent={progress.percent} tone={tone} />
      <span className="text-[10px] font-bold text-(--d5-muted)">
        {formatAmount(progress.current, unit)} / {formatAmount(Math.round(progress.target), unit)}
      </span>
    </button>
  );
}
