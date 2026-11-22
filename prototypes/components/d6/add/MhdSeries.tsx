"use client";

import { useRef } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { formatDate } from "@/lib/supply";
import type { MhdRead } from "../data/scan-simulation";
import { gsap, useGSAP } from "../motion/gsap";
import { MOTION_OK } from "../motion/motion";
import { MONO, cx } from "../theme/styles";
import { Stepper } from "../ui/Controls";

interface MhdSeriesProps {
  reads: MhdRead[];
  sameDate: boolean;
  sameCount: number;
  onSameDateChange: (sameDate: boolean) => void;
  onSameCountChange: (count: number) => void;
  onConfirm: (id: string) => void;
}

/** Zähler „Packung n · Datum ✓“, Chips je erkanntem MHD und die Abkürzung „alle gleiches Datum“. */
export function MhdSeries({ reads, sameDate, sameCount, onSameDateChange, onSameCountChange, onConfirm }: MhdSeriesProps) {
  const scope = useRef<HTMLDivElement>(null);
  const last = reads.at(-1);

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from("[data-chip]:last-child", { scale: 0.4, autoAlpha: 0, filter: "blur(6px)", duration: 0.5, ease: "back.out(2.5)", clearProps: "filter" });
        gsap.from("[data-counter]", { y: 8, autoAlpha: 0, duration: 0.35 });
      });
    },
    { scope, dependencies: [reads.length], revertOnUpdate: true },
  );

  return (
    <div ref={scope} className="grid gap-3">
      <p data-counter aria-live="polite" className={cx(MONO, "text-lg")}>
        {last ? (
          <>
            Packung {reads.length} · {formatDate(last.mhd)}{" "}
            <span className={last.needsCheck ? "text-(--d6-soon-text)" : "text-(--d6-ok-text)"}>{last.needsCheck ? "?" : "✓"}</span>
          </>
        ) : (
          <span className="text-sm text-(--d6-muted)">Noch kein Datum erfasst – Auslöser drücken.</span>
        )}
      </p>
      {reads.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Erkannte MHDs">
          {reads.map((read, i) => (
            <li key={read.id} data-chip>
              <button
                type="button"
                onClick={() => onConfirm(read.id)}
                disabled={!read.needsCheck}
                className={cx(
                  MONO,
                  "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]",
                  read.needsCheck
                    ? "border-(--d6-soon) bg-(--d6-review) text-(--d6-soon-text) shadow-[0_0_14px_-4px_var(--d6-soon)]"
                    : "border-(--d6-line) bg-(--d6-glass-strong) text-(--d6-muted)",
                )}
              >
                {read.needsCheck ? <TriangleAlert className="size-3" /> : <Check className="size-3 text-(--d6-ok-text)" />}
                {i + 1} · {formatDate(read.mhd)}
                {read.needsCheck && <span>· bitte prüfen</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
      {reads.some((r) => r.needsCheck) && <p className="text-xs text-(--d6-soon-text)">Tippe auf den gelben Chip, wenn das Datum stimmt.</p>}
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-(--d6-line) bg-(--d6-glass-strong) px-4 py-3 text-sm">
        <span>Alle gleiches Datum</span>
        <input type="checkbox" checked={sameDate} onChange={(e) => onSameDateChange(e.target.checked)} className="size-5 accent-(--d6-accent)" />
      </label>
      {sameDate && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-(--d6-line) bg-(--d6-glass-strong) px-4 py-2 text-sm">
          <span>Anzahl Packungen</span>
          <Stepper value={sameCount} onChange={onSameCountChange} label="Anzahl Packungen" />
        </div>
      )}
    </div>
  );
}
