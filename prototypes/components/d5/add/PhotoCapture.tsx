"use client";

import { useRef, useState } from "react";
import { CONTAINER_LABELS, getCategory } from "@/lib/categories";
import { formatAmount } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { burstConfetti } from "../confetti";
import { gsap, onMotion, useGSAP } from "../motion";
import { ChunkyButton } from "../ui/ChunkyButton";
import { SIMULATED_MHD_READS, buildProduct, type ProductDraft, type ScannedDate } from "./add-helpers";
import { CaptureSummary } from "./CaptureSummary";
import { MhdSeries } from "./MhdSeries";
import { RecognitionResult } from "./RecognitionResult";
import { StepDots } from "./StepDots";
import { Viewfinder } from "./Viewfinder";

type Step = "packaging" | "nutrition" | "mhd" | "summary";
const STEP_ORDER: Step[] = ["packaging", "nutrition", "mhd", "summary"];

interface PhotoCaptureProps {
  template: Product;
  onSaved: (product: Product) => void;
}

/** Foto-Modus: Verpackung → Nährwerte (optional) → MHD-Serie → Zusammenfassung. */
export function PhotoCapture({ template, onSaved }: PhotoCaptureProps) {
  const scope = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>("packaging");
  const [recognized, setRecognized] = useState(false);
  const [withNutrition, setWithNutrition] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scans, setScans] = useState<ScannedDate[]>([]);
  const [sameDate, setSameDate] = useState(false);
  const [sameCount, setSameCount] = useState(SIMULATED_MHD_READS.length);
  const category = getCategory(template.category);

  const draft: ProductDraft = {
    name: template.name,
    category: template.category,
    container: template.container,
    contentPerUnit: template.contentPerUnit,
    unit: template.unit,
    kcalPer100: withNutrition ? template.kcalPer100 : 0,
  };
  const firstDate = scans[0]?.mhd ?? SIMULATED_MHD_READS[0].mhd;
  const dates = sameDate ? Array.from({ length: sameCount }, () => firstDate) : scans.map((s) => s.mhd);

  const { contextSafe } = useGSAP(
    () =>
      onMotion(scope.current, () => {
        gsap.from("[data-result]", { scale: 0.6, opacity: 0, duration: 0.6, ease: "back.out(2.5)" });
      }),
    { scope, dependencies: [step, recognized], revertOnUpdate: true },
  );

  /** Simulierte Erkennung: kurze „Denkpause“, die beim Unmount mit aufgeräumt wird. */
  const recognize = contextSafe((onResult: () => void, seconds = 0.7) => {
    setBusy(true);
    gsap.delayedCall(seconds, () => {
      setBusy(false);
      onResult();
    });
  });

  const go = (next: Step) => {
    setRecognized(false);
    setStep(next);
  };

  const scanNext = () =>
    recognize(() => {
      setScans((list) => [...list, SIMULATED_MHD_READS[Math.min(list.length, SIMULATED_MHD_READS.length - 1)]]);
    }, 0.35);

  const save = () => {
    burstConfetti(scope.current, 40);
    onSaved(buildProduct(draft, dates));
  };

  return (
    <div ref={scope} className="space-y-4">
      <StepDots current={STEP_ORDER.indexOf(step)} />
      {step === "packaging" &&
        (recognized ? (
          <RecognitionResult title="Erkannt" nextLabel="Weiter: Nährwerte" onNext={() => go("nutrition")}>
            {category.emoji} {template.name} · {formatAmount(template.contentPerUnit, template.unit)} · {CONTAINER_LABELS[template.container]}
          </RecognitionResult>
        ) : (
          <Viewfinder subject="📦" hint="Vorderseite der Verpackung zeigen" shootLabel="Verpackung knipsen" busy={busy} onShoot={() => recognize(() => setRecognized(true))} />
        ))}
      {step === "nutrition" &&
        (recognized ? (
          <RecognitionResult title="Nährwerte gelesen" nextLabel="Weiter: MHD-Serie" onNext={() => go("mhd")}>
            {template.kcalPer100} kcal/100 {template.unit} →{" "}
            {Math.round((template.contentPerUnit * template.kcalPer100) / 100).toLocaleString("de-DE")} kcal pro Packung
          </RecognitionResult>
        ) : (
          <>
            <Viewfinder
              subject="🧾"
              hint="Nährwerttabelle ins Bild halten"
              shootLabel="Tabelle knipsen"
              busy={busy}
              onShoot={() => recognize(() => { setWithNutrition(true); setRecognized(true); })}
            />
            <button type="button" onClick={() => go("mhd")} className="w-full text-sm font-extrabold text-(--d5-muted) underline">
              Überspringen
            </button>
          </>
        ))}
      {step === "mhd" && (
        <>
          {!sameDate && (
            <Viewfinder subject="📅" hint="Ein Foto pro Packung: das MHD" shootLabel={`Packung ${scans.length + 1} knipsen`} busy={busy} onShoot={scanNext} />
          )}
          <MhdSeries
            scans={scans}
            onConfirm={(index) => setScans((list) => list.map((s, i) => (i === index ? { ...s, uncertain: false } : s)))}
            sameDate={sameDate}
            onSameDate={setSameDate}
            sameCount={sameCount}
            onSameCount={setSameCount}
          />
          <ChunkyButton tone="green" size="lg" disabled={dates.length === 0} onClick={() => go("summary")}>
            Fertig · {dates.length} Packungen
          </ChunkyButton>
        </>
      )}
      {step === "summary" && (
        <CaptureSummary draft={draft} dates={dates} emoji={category.emoji} onSave={save} onBack={() => go("mhd")} />
      )}
    </div>
  );
}
