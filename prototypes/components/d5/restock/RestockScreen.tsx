"use client";

import { useRef } from "react";
import type { RestockItem } from "@/lib/types";
import { burstConfetti } from "../confetti";
import { OverflowBar } from "../ui/OverflowBar";
import { RestockRow } from "./RestockRow";

interface RestockScreenProps {
  items: RestockItem[];
  onToggle: (id: string) => void;
}

/** Schlanke Nachkaufliste; ist alles abgehakt, gibt es den großen Konfetti-Regen. */
export function RestockScreen({ items, onToggle }: RestockScreenProps) {
  const header = useRef<HTMLDivElement>(null);
  const doneCount = items.filter((i) => i.done).length;
  const allDone = items.length > 0 && doneCount === items.length;
  const percent = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

  const toggle = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item && !item.done && doneCount + 1 === items.length) burstConfetti(header.current, 60);
    onToggle(id);
  };

  return (
    <div className="space-y-4 pt-1">
      <div ref={header} data-pop className="space-y-2">
        <h1 className="font-[family-name:var(--font-d5-display)] text-3xl font-extrabold">Nachkaufen 🛒</h1>
        <p className="text-sm font-bold text-(--d5-muted)" aria-live="polite">
          {allDone ? "Alles erledigt – der Vorrat ist wieder komplett! 🎉" : `${doneCount} von ${items.length} erledigt`}
        </p>
        <OverflowBar percent={percent} tone="pink" scaleMax={100} />
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <RestockRow key={item.id} item={item} onToggle={toggle} />
        ))}
      </ul>
    </div>
  );
}
