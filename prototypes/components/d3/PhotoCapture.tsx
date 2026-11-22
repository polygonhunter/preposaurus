"use client";

import { useRef, useState } from "react";
import { CONTAINER_LABELS, getCategory } from "@/lib/categories";
import { formatAmount } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { CaptureSummary } from "./CaptureSummary";
import { gsap, useGSAP } from "./gsap";
import { MhdSeries, type MhdChip } from "./MhdSeries";
import { isReducedMotion } from "./motion";
import { DetectionCard } from "./DetectionCard";
import { draftFromProduct, type StockDraft } from "./stock";
import { Viewfinder } from "./Viewfinder";

type Step = "verpackung" | "naehrwerte" | "mhd" | "fertig";

const STEPS: { key: Step; label: string }[] = [
  { key: "verpackung", label: "Verpackung" },
  { key: "naehrwerte", label: "Nährwerte" },
  { key: "mhd", label: "MHD" },
  { key: "fertig", label: "Fertig" },
];
/** Die dritte Packung wird als unsicher erkannt simuliert. */
const REVIEW_INDEX = 2;
const DEFAULT_SAME_DATE_COUNT = 10;

interface PhotoCaptureProps {
  sample: Product;
  onAdd: (draft: StockDraft) => void;
}

export function PhotoCapture({ sample, onAdd }: PhotoCaptureProps) {
  const [step, setStep] = useState<Step>("verpackung");
  const [scanning, setScanning] = useState(true);
  const [scanKey, setScanKey] = useState(0);
  const [detected, setDetected] = useState(false);
  const [chips, setChips] = useState<MhdChip[]>([]);
  const [sameDate, setSameDate] = useState(false);
  const [count, setCount] = useState(DEFAULT_SAME_DATE_COUNT);
  const panelRef = useRef<HTMLDivElement>(null);
  const sampleDates = sample.units.map((u) => u.mhd).sort();
  const amount = formatAmount(sample.contentPerUnit, sample.unit);

  const startScan = () => {
    setScanning(true);
    setScanKey((key) => key + 1);
  };
  const goTo = (next: Step) => {
    setStep(next);
    setDetected(false);
    if (next !== "fertig") startScan();
  };
  const handleDetected = () => {
    setScanning(false);
    if (step !== "mhd") {
      setDetected(true);
      return;
    }
    setChips((prev) => [
      ...prev,
      { id: prev.length, mhd: sampleDates[prev.length % sampleDates.length], needsReview: prev.length === REVIEW_INDEX },
    ]);
  };

  useGSAP(() => {
    if (isReducedMotion() || !panelRef.current) return;
    gsap.fromTo(panelRef.current, { autoAlpha: 0, y: 14, filter: "blur(8px)" },
      { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "power3.out", clearProps: "filter" });
  }, { dependencies: [step] });

  const mhds = sameDate ? Array<string>(count).fill(chips[0]?.mhd ?? "") : chips.map((c) => c.mhd);
  const captions: Record<Exclude<Step, "fertig">, string> = {
    verpackung: detected ? `${sample.name} · ${amount} erkannt` : "Packung in den Rahmen halten",
    naehrwerte: detected ? `${sample.kcalPer100} kcal / 100 ${sample.unit} erkannt` : "Nährwerttabelle zeigen",
    mhd: "MHD erkannt",
  };

  return (
    <div className="space-y-4">
      <ol className="flex justify-between gap-1 text-[11px] font-medium">
        {STEPS.map(({ key, label }, index) => {
          const reached = STEPS.findIndex((s) => s.key === step) >= index;
          return (
            <li key={key} className={`flex flex-1 flex-col items-center gap-1 ${reached ? "text-slate-900" : "text-slate-400"}`}>
              <span className={`h-1 w-full rounded-full transition-colors duration-500 ${reached ? "bg-slate-900" : "bg-slate-900/10"}`} />
              {label}
            </li>
          );
        })}
      </ol>

      {step !== "fertig" && (
        <Viewfinder emoji={getCategory(sample.category).emoji} caption={captions[step]}
          scanning={scanning} scanKey={scanKey} onDetected={handleDetected} />
      )}

      <div ref={panelRef}>
        {step === "verpackung" && (
          <DetectionCard title={`${sample.name} · ${amount}`} detail={`${CONTAINER_LABELS[sample.container]} · ${getCategory(sample.category).label}`}
            ready={detected} primaryLabel="Weiter" onPrimary={() => goTo("naehrwerte")} />
        )}
        {step === "naehrwerte" && (
          <DetectionCard optional title={`${sample.kcalPer100} kcal je 100 ${sample.unit}`} detail="Für die Berechnung der Energie-Tage"
            ready={detected} primaryLabel="Übernehmen" onPrimary={() => goTo("mhd")} onSkip={() => goTo("mhd")} />
        )}
        {step === "mhd" && (
          <MhdSeries chips={chips} scanning={scanning} sameDate={sameDate} count={count} onScanNext={startScan}
            onConfirmChip={(id) => setChips((prev) => prev.map((c) => (c.id === id ? { ...c, needsReview: false } : c)))}
            onSameDate={setSameDate} onCount={setCount} onDone={() => goTo("fertig")} />
        )}
        {step === "fertig" && (
          <CaptureSummary product={sample} mhds={mhds}
            onConfirm={() => onAdd(draftFromProduct(sample, mhds))} />
        )}
      </div>
    </div>
  );
}
