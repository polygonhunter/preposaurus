"use client";

import { Check } from "lucide-react";
import type { RestockItem } from "@/lib/types";
import { useFlipLayout } from "../motion/hooks";
import { popFeedback } from "../motion/motion";
import { LABEL, MONO, cx } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";
import { Ticker } from "../ui/Ticker";

interface RestockScreenProps {
  items: RestockItem[];
  onToggle: (id: string) => void;
}

/** Schlanke Nachkaufen-Liste: abhaken, erledigte Einträge gleiten per Flip nach unten. */
export function RestockScreen({ items, onToggle }: RestockScreenProps) {
  const { scope, capture } = useFlipLayout<HTMLUListElement>("li", [items]);
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done));
  const doneCount = items.filter((i) => i.done).length;
  const share = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <div className="mx-auto max-w-lg space-y-3">
      <GlassTile label="Einkaufsliste">
        <div className="flex items-end justify-between gap-4">
          <p className="text-sm text-(--d6-muted)">Aus den Lücken zu deinem Ziel berechnet.</p>
          <p className="shrink-0 text-right">
            <Ticker value={items.length - doneCount} className="text-4xl font-light" />
            <span className={`${LABEL} block`}>offen</span>
          </p>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-(--d6-track)">
          <div
            data-bar
            className="h-full rounded-full bg-(--d6-surplus) shadow-[0_0_10px_var(--d6-surplus)] transition-[width] duration-500"
            style={{ width: `${share}%` }}
          />
        </div>
      </GlassTile>

      <GlassTile padding="p-2">
        <ul ref={scope}>
          {sorted.map((item) => (
            <li key={item.id} data-flip-id={item.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={item.done}
                onClick={(event) => {
                  capture();
                  onToggle(item.id);
                  popFeedback(event.currentTarget.querySelector("[data-check]"));
                }}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition hover:bg-(--d6-track)"
              >
                <span
                  data-check
                  className={cx(
                    "grid size-7 shrink-0 place-items-center rounded-full border transition-colors",
                    item.done
                      ? "border-(--d6-surplus) bg-(--d6-surplus) text-(--d6-on-ink) shadow-[0_0_12px_-2px_var(--d6-surplus)]"
                      : "border-(--d6-subtle)/60 bg-(--d6-glass-strong)",
                  )}
                >
                  {item.done && <Check size={15} strokeWidth={3} />}
                </span>
                <span className={cx("flex-1 text-[15px]", item.done ? "text-(--d6-subtle) line-through" : "font-medium")}>{item.label}</span>
                <span className={cx(MONO, "text-sm", item.done ? "text-(--d6-subtle)" : "text-(--d6-muted)")}>{item.amount}</span>
              </button>
            </li>
          ))}
        </ul>
      </GlassTile>
      <p data-tile className={cx(LABEL, "text-center")}>
        Nur, was dem Vorrat fehlt – keine Einkaufsliste für alles.
      </p>
    </div>
  );
}
