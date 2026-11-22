"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import type { RestockItem } from "@/lib/types";
import { CountUp } from "./CountUp";
import { GlassTile } from "./GlassTile";
import { Flip, useGSAP } from "./gsap";
import { isReducedMotion, popFeedback } from "./motion";
import { LABEL } from "./styles";

interface RestockScreenProps {
  items: RestockItem[];
  onToggle: (id: string) => void;
}

/** Schlanke Einkaufsliste; erledigte Einträge gleiten nach unten. */
export function RestockScreen({ items, onToggle }: RestockScreenProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done));
  const doneCount = items.filter((i) => i.done).length;

  const toggle = (id: string, checkmark: Element | null) => {
    const rows = listRef.current?.querySelectorAll("li");
    if (rows) flipState.current = Flip.getState(rows);
    onToggle(id);
    popFeedback(checkmark);
  };

  useGSAP(() => {
    const state = flipState.current;
    flipState.current = null;
    const rows = listRef.current?.querySelectorAll("li");
    if (!state || !rows || isReducedMotion()) return;
    Flip.from(state, { targets: rows, duration: 0.6, ease: "power3.inOut" });
  }, { dependencies: [items], scope: listRef });

  return (
    <div className="space-y-3">
      <GlassTile className="flex items-center justify-between">
        <div>
          <span className={LABEL}>Einkaufsliste</span>
          <p className="mt-1 text-sm text-slate-600">Aus den Lücken zu deinem Ziel berechnet.</p>
        </div>
        <p className="text-right">
          <CountUp value={items.length - doneCount} className="text-4xl font-extralight" />
          <span className="block text-xs text-slate-500">offen</span>
        </p>
      </GlassTile>

      <GlassTile magnetic={false} className="p-2">
        <ul ref={listRef}>
          {sorted.map((item) => (
            <li key={item.id} data-flip-id={item.id}>
              <button
                type="button"
                aria-pressed={item.done}
                onClick={(event) => toggle(item.id, event.currentTarget.querySelector("[data-check]"))}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition hover:bg-white/50"
              >
                <span data-check className={`grid size-7 shrink-0 place-items-center rounded-full border transition-colors ${
                  item.done ? "border-emerald-400 bg-emerald-400 text-white" : "border-slate-300 bg-white/70"}`}>
                  {item.done && <Check size={15} strokeWidth={3} />}
                </span>
                <span className={`flex-1 text-[15px] ${item.done ? "text-slate-400 line-through" : "font-medium"}`}>{item.label}</span>
                <span className={`text-sm tabular-nums ${item.done ? "text-slate-400" : "text-slate-600"}`}>{item.amount}</span>
              </button>
            </li>
          ))}
        </ul>
      </GlassTile>
    </div>
  );
}
