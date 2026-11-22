"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check, TriangleAlert } from "lucide-react";
import { formatDate } from "@/lib/supply";
import { whenMotionAllowed } from "../motion";
import { Stepper } from "../ui/Stepper";
import { LABEL, MONO, cx } from "../theme";
import type { MhdRead } from "./scan-simulation";

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
  const chipsRef = useRef<HTMLUListElement>(null);
  const last = reads.at(-1);

  useGSAP(
    () => {
      whenMotionAllowed(chipsRef, () => {
        gsap.from(chipsRef.current?.lastElementChild ?? [], { scale: 0.4, autoAlpha: 0, duration: 0.45, ease: "back.out(2.5)" });
      });
    },
    { scope: chipsRef, dependencies: [reads.length], revertOnUpdate: true },
  );

  return (
    <div className="grid gap-3">
      <p className={cx(MONO, "text-lg text-zinc-100")}>
        {last ? (
          <>
            Packung {reads.length} · {formatDate(last.mhd)}{" "}
            <span className={last.needsCheck ? "text-yellow-300" : "text-(--d2-surplus)"}>{last.needsCheck ? "?" : "✓"}</span>
          </>
        ) : (
          <span className="text-zinc-500">Noch kein Datum erfasst</span>
        )}
      </p>
      <ul ref={chipsRef} className="flex flex-wrap gap-1.5" aria-label="Erkannte MHDs">
        {reads.map((read, i) => (
          <li key={read.id}>
            <button
              type="button"
              onClick={() => onConfirm(read.id)}
              disabled={!read.needsCheck}
              className={cx(
                MONO,
                "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px]",
                read.needsCheck
                  ? "border-yellow-300/60 bg-yellow-300/10 text-yellow-200 shadow-[0_0_14px_-4px_rgba(253,224,71,0.8)]"
                  : "border-white/10 text-zinc-300",
              )}
            >
              {read.needsCheck ? <TriangleAlert className="size-3" /> : <Check className="size-3 text-(--d2-surplus)" />}
              {i + 1} · {formatDate(read.mhd)}
              {read.needsCheck && <span>· bitte prüfen</span>}
            </button>
          </li>
        ))}
      </ul>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] px-3 py-2.5">
        <span className="text-sm text-zinc-300">Alle gleiches Datum</span>
        <input
          type="checkbox"
          checked={sameDate}
          onChange={(e) => onSameDateChange(e.target.checked)}
          className="size-5 accent-(--d2-accent)"
        />
      </label>
      {sameDate && (
        <div className="flex items-center justify-between gap-3">
          <span className={LABEL}>Anzahl Packungen</span>
          <Stepper value={sameCount} onChange={onSameCountChange} label="Anzahl Packungen" />
        </div>
      )}
    </div>
  );
}
