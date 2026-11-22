"use client";

import { useRef } from "react";
import { Check, ScanLine } from "lucide-react";
import { formatDate } from "@/lib/supply";
import { gsap, useGSAP } from "./gsap";
import { isReducedMotion } from "./motion";
import { Stepper } from "./Stepper";
import { CHIP, PRIMARY_BUTTON } from "./styles";

export interface MhdChip {
  id: number;
  mhd: string;
  needsReview: boolean;
}

interface MhdSeriesProps {
  chips: MhdChip[];
  scanning: boolean;
  sameDate: boolean;
  count: number;
  onScanNext: () => void;
  onConfirmChip: (id: number) => void;
  onSameDate: (value: boolean) => void;
  onCount: (value: number) => void;
  onDone: () => void;
}

export function MhdSeries(props: MhdSeriesProps) {
  const { chips, scanning, sameDate, count, onScanNext, onConfirmChip, onSameDate, onCount, onDone } = props;
  const scope = useRef<HTMLDivElement>(null);
  const last = chips.at(-1);
  const hasOpenReview = chips.some((c) => c.needsReview);

  useGSAP(() => {
    const newest = scope.current?.querySelector("[data-chip]:last-child");
    if (!newest || isReducedMotion()) return;
    gsap.fromTo(newest, { scale: 0.5, autoAlpha: 0, filter: "blur(6px)" },
      { scale: 1, autoAlpha: 1, filter: "blur(0px)", duration: 0.6, ease: "back.out(2)", clearProps: "filter" });
    gsap.fromTo("[data-counter]", { y: 8, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4 });
  }, { dependencies: [chips.length], scope });

  return (
    <div ref={scope} className="space-y-4">
      <p data-counter className="text-center text-[15px] tabular-nums" aria-live="polite">
        {last ? (
          <>
            Packung {chips.length} · {formatDate(last.mhd)}{" "}
            {last.needsReview ? <span className="text-amber-600">bitte prüfen</span> : <span className="text-emerald-600">✓</span>}
          </>
        ) : (
          <span className="text-slate-500">Halte das MHD der ersten Packung in den Rahmen.</span>
        )}
      </p>

      <ul className="flex flex-wrap justify-center gap-2">
        {chips.map((chip, index) => (
          <li key={chip.id} data-chip>
            <button
              type="button"
              disabled={!chip.needsReview}
              onClick={() => onConfirmChip(chip.id)}
              className={`${CHIP} tabular-nums ${chip.needsReview ? "bg-amber-200/90 text-amber-900 ring-1 ring-amber-400" : "bg-white/80 text-slate-700"}`}
            >
              {index + 1} · {formatDate(chip.mhd)} {chip.needsReview ? "· bitte prüfen" : <Check size={12} className="inline" />}
            </button>
          </li>
        ))}
      </ul>
      {hasOpenReview && <p className="text-center text-xs text-amber-700">Tippe auf den gelben Chip, wenn das Datum stimmt.</p>}

      <label className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-3 text-sm">
        <span>Alle gleiches Datum</span>
        <input type="checkbox" checked={sameDate} onChange={(e) => onSameDate(e.target.checked)}
          className="size-5 accent-slate-900" />
      </label>
      {sameDate && (
        <div className="flex items-center justify-between rounded-2xl bg-white/60 px-4 py-2 text-sm">
          <span>Anzahl Packungen</span>
          <Stepper label="Anzahl Packungen" value={count} onChange={onCount} />
        </div>
      )}

      <div className="flex gap-2">
        {!sameDate && (
          <button type="button" onClick={onScanNext} disabled={scanning}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white/80 px-4 py-3 text-sm font-medium transition active:scale-[0.97] disabled:opacity-50">
            <ScanLine size={16} /> Nächste Packung
          </button>
        )}
        <button type="button" onClick={onDone} disabled={chips.length === 0 || hasOpenReview} className={`${PRIMARY_BUTTON} flex-1`}>
          Fertig
        </button>
      </div>
    </div>
  );
}
