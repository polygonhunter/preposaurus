"use client";

import { useRef, useState } from "react";
import { Camera, PenLine } from "lucide-react";
import type { Product } from "@/lib/types";
import { gsap, onMotion, useGSAP } from "../motion";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { ManualForm } from "./ManualForm";
import { PhotoCapture } from "./PhotoCapture";
import { SavedCelebration } from "./SavedCelebration";

interface AddScreenProps {
  /** Produkt, das die simulierte Foto-Erkennung „findet“ */
  template: Product;
  today: string;
  onAdd: (product: Product) => void;
  onDone: () => void;
}

type Mode = "photo" | "manual";

/** Hinzufügen: Umschalter Foto | Manuell und Erfolgs-Feier nach dem Speichern. */
export function AddScreen({ template, today, onAdd, onDone }: AddScreenProps) {
  const scope = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("photo");
  const [saved, setSaved] = useState<Product | null>(null);

  useGSAP(
    () =>
      onMotion(scope.current, () => {
        gsap.from(".mode-panel", { y: 30, opacity: 0, duration: 0.5, ease: "back.out(2)" });
      }),
    { scope, dependencies: [mode, saved], revertOnUpdate: true },
  );

  const handleSaved = (product: Product) => {
    onAdd(product);
    setSaved(product);
  };

  return (
    <div ref={scope} className="space-y-4 pt-1">
      <div data-pop>
        <h1 className="font-[family-name:var(--font-d5-display)] text-3xl font-extrabold">Neu hinzufügen ➕</h1>
        <p className="text-sm font-bold text-(--d5-muted)">Fotos machen die Arbeit – du bestätigst nur.</p>
      </div>
      {!saved && (
        <div data-pop>
          <SegmentedToggle
            label="Erfassungsart"
            value={mode}
            onChange={setMode}
            options={[
              { value: "photo", label: <><Camera className="size-4" strokeWidth={3} /> Foto</> },
              { value: "manual", label: <><PenLine className="size-4" strokeWidth={3} /> Manuell</> },
            ]}
          />
        </div>
      )}
      <div className="mode-panel">
        {saved ? (
          <SavedCelebration product={saved} onAnother={() => setSaved(null)} onDone={onDone} />
        ) : mode === "photo" ? (
          <PhotoCapture template={template} onSaved={handleSaved} />
        ) : (
          <ManualForm today={today} onSaved={handleSaved} />
        )}
      </div>
    </div>
  );
}
