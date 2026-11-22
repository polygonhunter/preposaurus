"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { CONTAINER_LABELS, getCategory } from "@/lib/categories";
import { resolveMacros } from "@/lib/nutrition";
import { formatAmount } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { formatNumber } from "../data/format";
import {
  CAPTURE_STEPS,
  MAX_MHD_PHOTOS,
  RECOGNITION_DELAY_S,
  simulateMhdRead,
  type CaptureStep,
  type MhdRead,
} from "../data/scan-simulation";
import { draftFromProduct, estimateKcalPer100, type StockDraft, type StockProduct } from "../data/stock";
import { useDelayedCall } from "../motion/hooks";
import { flashGlow } from "../motion/motion";
import { BADGE, BUTTON_PRIMARY, BUTTON_SECONDARY, MONO, cx } from "../theme/styles";
import { MacroLine } from "../ui/MacroLine";
import { CaptureSteps } from "./CaptureSteps";
import { CaptureSummary } from "./CaptureSummary";
import { MhdSeries } from "./MhdSeries";
import { Viewfinder } from "./Viewfinder";

const DEFAULT_SAME_COUNT = 10;

interface PhotoCaptureProps {
  sample: Product;
  products: StockProduct[];
  onAdd: (draft: StockDraft) => void;
}

/** Simulierter Foto-Ablauf: Verpackung → Nährwerte (optional) → MHD-Serie → Prüfen. */
export function PhotoCapture({ sample, products, onAdd }: PhotoCaptureProps) {
  const scope = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<CaptureStep>("verpackung");
  const [analyzing, setAnalyzing] = useState(false);
  const [nutritionScanned, setNutritionScanned] = useState(false);
  const [reads, setReads] = useState<MhdRead[]>([]);
  const [sameDate, setSameDate] = useState(false);
  const [sameCount, setSameCount] = useState(DEFAULT_SAME_COUNT);
  const later = useDelayedCall(scope);

  const estimate = estimateKcalPer100(products, sample.category);
  const nutrition = nutritionScanned
    ? { kcalPer100: sample.kcalPer100, kcalEstimated: false, macrosPer100: sample.macrosPer100 }
    : { kcalPer100: estimate.kcalPer100, kcalEstimated: true };
  const { kcalPer100 } = nutrition;
  const mhds = sameDate && reads[0] ? Array<string>(sameCount).fill(reads[0].mhd) : reads.map((r) => r.mhd);
  const draft = draftFromProduct(sample, mhds, nutrition);
  const macros = resolveMacros(draft, products);
  const unresolved = reads.some((r) => r.needsCheck);
  const hint = CAPTURE_STEPS.find((s) => s.key === step)?.hint ?? "";
  const shutterDisabled = step === "mhd" && (reads.length >= MAX_MHD_PHOTOS || (sameDate && reads.length > 0));

  const recognize = (onDone: () => void) => {
    setAnalyzing(true);
    later(RECOGNITION_DELAY_S, () => {
      setAnalyzing(false);
      onDone();
      flashGlow(scope.current?.querySelector("[data-glow]"));
    });
  };

  const shutter = () => {
    if (step === "verpackung") recognize(() => setStep("naehrwerte"));
    if (step === "naehrwerte")
      recognize(() => {
        setNutritionScanned(true);
        setStep("mhd");
      });
    if (step === "mhd") recognize(() => setReads((list) => [...list, simulateMhdRead(list.length, list.at(-1))]));
  };

  return (
    <div ref={scope} className="grid gap-4">
      <CaptureSteps current={step} />
      {step !== "pruefen" && (
        <Viewfinder
          subject={getCategory(sample.category).emoji}
          hint={hint}
          analyzing={analyzing}
          shutterDisabled={shutterDisabled}
          onShutter={shutter}
        />
      )}

      <div className="relative grid gap-3 rounded-2xl border border-(--d6-line) bg-(--d6-glass-strong) p-4">
        <span
          data-glow
          aria-hidden
          className="pointer-events-none invisible absolute inset-0 rounded-2xl border border-(--d6-accent) shadow-[0_0_28px_-4px_var(--d6-glow)]"
        />
        {step === "verpackung" ? (
          <p className="text-sm text-(--d6-muted)">Erkannt werden Art, Behälter und Inhalt – ohne Marke, ohne Barcode.</p>
        ) : (
          <p className="flex items-center gap-2 text-[15px] font-semibold">
            <Sparkles className="size-4 shrink-0 text-(--d6-accent-text)" />
            {sample.name} · {formatAmount(sample.contentPerUnit, sample.unit)} · {CONTAINER_LABELS[sample.container]}
          </p>
        )}
        {(step === "mhd" || step === "pruefen") && (
          <p className={`${MONO} text-xs text-(--d6-muted)`}>
            {kcalPer100} kcal/100 {sample.unit} → {formatNumber((sample.contentPerUnit * kcalPer100) / 100)} kcal pro Stück
            {!nutritionScanned && <span className={cx(BADGE, "ml-1")}>geschätzt</span>}
          </p>
        )}
        {step === "mhd" && <MacroLine macros={macros} unit={sample.unit} />}
        {step === "naehrwerte" && (
          <button type="button" className={BUTTON_SECONDARY} onClick={() => setStep("mhd")} disabled={analyzing}>
            Nährwerte überspringen
          </button>
        )}
        {step === "mhd" && (
          <>
            <MhdSeries
              reads={reads}
              sameDate={sameDate}
              sameCount={sameCount}
              onSameDateChange={setSameDate}
              onSameCountChange={setSameCount}
              onConfirm={(id) => setReads((list) => list.map((r) => (r.id === id ? { ...r, needsCheck: false } : r)))}
            />
            <button type="button" className={BUTTON_PRIMARY} disabled={reads.length === 0 || unresolved} onClick={() => setStep("pruefen")}>
              {unresolved ? "Erst gelben Chip bestätigen" : "Fertig – weiter zur Prüfung"}
            </button>
          </>
        )}
        {step === "pruefen" && (
          <>
            <CaptureSummary draft={draft} macros={macros} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={BUTTON_SECONDARY} onClick={() => setStep("mhd")}>
                Zurück
              </button>
              <button type="button" className={BUTTON_PRIMARY} onClick={() => onAdd(draft)}>
                In den Vorrat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
