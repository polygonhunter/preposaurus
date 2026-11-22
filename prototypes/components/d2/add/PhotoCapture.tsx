"use client";

import { useRef, useState } from "react";
import { getCategory, CONTAINER_LABELS } from "@/lib/categories";
import { formatAmount } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { formatDecimal } from "../format";
import { useDelayedCall, useGlowPulse } from "../motion";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, MONO } from "../theme";
import { CaptureSteps } from "./CaptureSteps";
import { CaptureSummary } from "./CaptureSummary";
import { MhdSeries } from "./MhdSeries";
import {
  CAPTURE_STEPS,
  MAX_MHD_PHOTOS,
  RECOGNITION_DELAY_S,
  buildCapturedProduct,
  simulateMhdRead,
  type CaptureStep,
  type MhdRead,
} from "./scan-simulation";
import { Viewfinder } from "./Viewfinder";

interface PhotoCaptureProps {
  template: Product;
  onSave: (product: Product) => void;
}

/** Simulierter Foto-Ablauf: Verpackung → Nährwerte (optional) → MHD-Serie → Prüfen. */
export function PhotoCapture({ template, onSave }: PhotoCaptureProps) {
  const scope = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<CaptureStep>("verpackung");
  const [analyzing, setAnalyzing] = useState(false);
  const [nutritionScanned, setNutritionScanned] = useState(false);
  const [reads, setReads] = useState<MhdRead[]>([]);
  const [sameDate, setSameDate] = useState(false);
  const [sameCount, setSameCount] = useState(MAX_MHD_PHOTOS);
  const pulse = useGlowPulse(scope);
  const later = useDelayedCall(scope);

  const stepInfo = CAPTURE_STEPS.find((s) => s.key === step);
  const mhds = sameDate && reads[0] ? Array<string>(sameCount).fill(reads[0].mhd) : reads.map((r) => r.mhd);
  const captured = buildCapturedProduct(template, mhds, 0);
  const kcalPerUnit = (template.contentPerUnit * template.kcalPer100) / 100;

  const recognize = (onDone: () => void) => {
    setAnalyzing(true);
    later(RECOGNITION_DELAY_S, () => {
      setAnalyzing(false);
      onDone();
      pulse(resultRef.current);
    });
  };

  const shutter = () => {
    if (step === "verpackung") recognize(() => setStep("naehrwerte"));
    if (step === "naehrwerte") recognize(() => { setNutritionScanned(true); setStep("mhd"); });
    if (step === "mhd") recognize(() => setReads((list) => [...list, simulateMhdRead(list.length, list.at(-1))]));
  };

  const confirmRead = (id: string) =>
    setReads((list) => list.map((r) => (r.id === id ? { ...r, needsCheck: false } : r)));

  const save = () => {
    onSave(buildCapturedProduct(template, mhds, Date.now()));
    setStep("verpackung");
    setReads([]);
    setNutritionScanned(false);
    setSameDate(false);
  };

  const shutterDisabled = step === "pruefen" || (step === "mhd" && (reads.length >= MAX_MHD_PHOTOS || (sameDate && reads.length > 0)));
  const unresolved = reads.some((r) => r.needsCheck);

  return (
    <div ref={scope} className="grid gap-4">
      <CaptureSteps current={step} />
      {step !== "pruefen" && (
        <Viewfinder
          subject={getCategory(template.category).emoji}
          hint={stepInfo?.hint ?? ""}
          analyzing={analyzing}
          shutterDisabled={shutterDisabled}
          onShutter={shutter}
        />
      )}

      <div ref={resultRef} className="grid gap-3 rounded-2xl border border-white/[0.07] bg-(--d2-panel)/90 p-4">
        {step === "verpackung" && <p className="text-sm text-zinc-400">Erkannt werden Art, Behälter und Inhalt – ohne Marke, ohne Barcode.</p>}
        {step !== "verpackung" && (
          <p className={`${MONO} text-zinc-100`}>
            {template.name} · {formatAmount(template.contentPerUnit, template.unit)} · {CONTAINER_LABELS[template.container]}
          </p>
        )}
        {nutritionScanned && (
          <p className={`${MONO} text-sm text-zinc-400`}>
            {template.kcalPer100} kcal/100 {template.unit} → <span className="text-(--d2-accent)">{formatDecimal(kcalPerUnit)} kcal</span> pro Stück
          </p>
        )}
        {step === "naehrwerte" && (
          <button type="button" className={BUTTON_SECONDARY} onClick={() => setStep("mhd")}>
            Überspringen
          </button>
        )}
        {step === "mhd" && (
          <MhdSeries
            reads={reads}
            sameDate={sameDate}
            sameCount={sameCount}
            onSameDateChange={setSameDate}
            onSameCountChange={setSameCount}
            onConfirm={confirmRead}
          />
        )}
        {step === "mhd" && (
          <button type="button" className={BUTTON_PRIMARY} disabled={reads.length === 0 || unresolved} onClick={() => setStep("pruefen")}>
            {unresolved ? "Gelben Chip antippen zum Bestätigen" : "Fertig – weiter zur Prüfung"}
          </button>
        )}
        {step === "pruefen" && (
          <>
            <CaptureSummary product={captured} kcalEstimated={!nutritionScanned} />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={BUTTON_SECONDARY} onClick={() => setStep("mhd")}>
                Zurück
              </button>
              <button type="button" className={BUTTON_PRIMARY} onClick={save}>
                Speichern
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
