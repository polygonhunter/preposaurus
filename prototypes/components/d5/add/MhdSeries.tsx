"use client";

import { useRef } from "react";
import { formatDate } from "@/lib/supply";
import { gsap, onMotion, useGSAP } from "../motion";
import { toneVars } from "../theme";
import { Stepper } from "../ui/Stepper";
import type { ScannedDate } from "./add-helpers";

interface MhdSeriesProps {
  scans: ScannedDate[];
  onConfirm: (index: number) => void;
  sameDate: boolean;
  onSameDate: (value: boolean) => void;
  sameCount: number;
  onSameCount: (value: number) => void;
}

/** Zähler + Chips der MHD-Serie; unsichere Lesungen sind gelb und antippbar. */
export function MhdSeries({ scans, onConfirm, sameDate, onSameDate, sameCount, onSameCount }: MhdSeriesProps) {
  const scope = useRef<HTMLDivElement>(null);
  const last = scans.at(-1);

  useGSAP(
    () =>
      onMotion(scope.current, () => {
        gsap.from(".mhd-chip:last-child", { scale: 0, rotation: -15, duration: 0.7, ease: "elastic.out(1.2, 0.4)" });
        gsap.from(".counter", { scale: 1.25, duration: 0.5, ease: "back.out(3)" });
      }),
    { scope, dependencies: [scans.length], revertOnUpdate: true },
  );

  return (
    <div ref={scope} className="space-y-3">
      {last && !sameDate && (
        <p className="counter rounded-2xl bg-[#4CC66A] px-4 py-2 text-center text-lg font-black text-white shadow-[0_4px_0_#2F9E4C]" aria-live="polite">
          Packung {scans.length} · {formatDate(last.mhd)} ✓
        </p>
      )}
      <label className="flex items-center justify-between gap-3 rounded-2xl bg-(--d5-soft) px-4 py-3 font-extrabold">
        Alle haben das gleiche Datum
        <input
          type="checkbox"
          checked={sameDate}
          onChange={(event) => onSameDate(event.target.checked)}
          className="size-6 accent-[#4CC66A]"
        />
      </label>
      {sameDate ? (
        <div className="flex items-center justify-between rounded-2xl border-2 border-(--d5-line) bg-white px-4 py-3">
          <span className="font-extrabold">Wie viele Packungen?</span>
          <Stepper label="Anzahl Packungen" value={sameCount} onChange={onSameCount} />
        </div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {scans.map((scan, index) => {
            const needsCheck = scan.uncertain;
            return (
              <li key={index} className="mhd-chip">
                <button
                  type="button"
                  onClick={() => needsCheck && onConfirm(index)}
                  style={toneVars(needsCheck ? "yellow" : "green")}
                  className="rounded-full bg-(--tone) px-3 py-1 text-xs font-black text-(--tone-ink) shadow-[0_3px_0_var(--tone-edge)]"
                >
                  {index + 1} · {formatDate(scan.mhd)} {needsCheck ? "· bitte prüfen" : "✓"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
