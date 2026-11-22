"use client";

import { useRef, useState } from "react";
import { Camera, CircleCheck, Keyboard } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard-data";
import type { Product } from "@/lib/types";
import { ManualForm } from "../add/ManualForm";
import { PhotoCapture } from "../add/PhotoCapture";
import { useGlowPulse, useScreenReveal } from "../motion";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { MONO } from "../theme";

type Mode = "foto" | "manuell";

const MODES = [
  { value: "foto" as const, label: "Foto", icon: Camera },
  { value: "manuell" as const, label: "Manuell", icon: Keyboard },
];

interface AddScreenProps {
  data: DashboardData;
  onSave: (product: Product) => void;
}

export function AddScreen({ data, onSave }: AddScreenProps) {
  const scope = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLParagraphElement>(null);
  const [mode, setMode] = useState<Mode>("foto");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const pulse = useGlowPulse(scope);
  useScreenReveal(scope, [mode]);

  const save = (product: Product) => {
    onSave(product);
    setLastSaved(`${product.units.length} × ${product.name} im Vorrat`);
    requestAnimationFrame(() => pulse(toastRef.current));
  };

  return (
    <div ref={scope} className="mx-auto grid max-w-md gap-4">
      <SegmentedToggle options={MODES} value={mode} onChange={setMode} label="Erfassungsart" />
      {lastSaved && (
        <p
          ref={toastRef}
          role="status"
          className={`${MONO} flex items-center gap-2 rounded-xl border border-(--d2-surplus)/40 bg-(--d2-surplus)/10 px-3 py-2 text-sm text-(--d2-surplus)`}
        >
          <CircleCheck className="size-4" /> {lastSaved}
        </p>
      )}
      {mode === "foto" ? (
        <PhotoCapture template={data.products[0]} onSave={save} />
      ) : (
        <ManualForm today={data.today} onSave={save} />
      )}
    </div>
  );
}
