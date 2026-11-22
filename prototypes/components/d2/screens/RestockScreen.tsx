"use client";

import { useRef } from "react";
import { Check } from "lucide-react";
import type { RestockItem } from "@/lib/types";
import { useGlowPulse, useScreenReveal } from "../motion";
import { Panel } from "../ui/Panel";
import { Ticker } from "../ui/Ticker";
import { LABEL, MONO, cx } from "../theme";

interface RestockScreenProps {
  items: RestockItem[];
  onToggle: (id: string) => void;
}

/** Schlanke Nachkaufen-Liste: abhaken mit Glow-Bestätigung, Fortschritt oben. */
export function RestockScreen({ items, onToggle }: RestockScreenProps) {
  const scope = useRef<HTMLDivElement>(null);
  const pulse = useGlowPulse(scope);
  useScreenReveal(scope);
  const doneCount = items.filter((item) => item.done).length;
  const progress = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <div ref={scope} className="mx-auto grid max-w-md gap-3">
      <Panel label="Nachkaufen">
        <p className="text-zinc-50">
          <Ticker value={doneCount} className="text-4xl font-light" />
          <span className="text-zinc-400"> von {items.length} erledigt</span>
        </p>
        <div className="mt-3 h-1.5 rounded-full bg-white/[0.05]">
          <div
            className="h-full rounded-full bg-(--d2-surplus) shadow-[0_0_10px_var(--d2-surplus)] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Panel>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.id} data-reveal>
            <button
              type="button"
              role="checkbox"
              aria-checked={item.done}
              onClick={(event) => {
                onToggle(item.id);
                if (!item.done) pulse(event.currentTarget);
              }}
              className={cx(
                "flex w-full items-center gap-3 rounded-2xl border bg-(--d2-panel)/90 px-4 py-3 text-left transition-colors",
                item.done ? "border-white/[0.04]" : "border-white/[0.08] hover:border-(--d2-accent)/40",
              )}
            >
              <span
                className={cx(
                  "grid size-6 shrink-0 place-items-center rounded-md border transition-colors",
                  item.done ? "border-(--d2-surplus) bg-(--d2-surplus) text-black" : "border-white/25",
                )}
              >
                {item.done && <Check className="size-4" strokeWidth={3} />}
              </span>
              <span className={cx("flex-1", item.done ? "text-zinc-500 line-through" : "text-zinc-100")}>{item.label}</span>
              <span className={cx(MONO, "text-xs", item.done ? "text-zinc-600" : "text-zinc-400")}>{item.amount}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className={cx(LABEL, "text-center")}>Nur, was dem Vorrat fehlt – keine Einkaufsliste für alles.</p>
    </div>
  );
}
