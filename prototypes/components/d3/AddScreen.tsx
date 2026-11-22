"use client";

import { useState } from "react";
import { Camera, PenLine } from "lucide-react";
import type { Product } from "@/lib/types";
import { GlassTile } from "./GlassTile";
import { ManualForm } from "./ManualForm";
import { PhotoCapture } from "./PhotoCapture";
import { SegmentedControl } from "./SegmentedControl";
import type { StockDraft } from "./stock";

type AddMode = "foto" | "manuell";

interface AddScreenProps {
  sample: Product;
  today: string;
  onAdd: (draft: StockDraft) => void;
}

export function AddScreen({ sample, today, onAdd }: AddScreenProps) {
  const [mode, setMode] = useState<AddMode>("foto");

  return (
    <div className="space-y-3">
      <div data-tile className="flex justify-center">
        <SegmentedControl
          flipId="d3-add-mode-pill"
          value={mode}
          onChange={setMode}
          options={[
            { key: "foto", label: "Foto", icon: Camera },
            { key: "manuell", label: "Manuell", icon: PenLine },
          ]}
        />
      </div>
      <GlassTile magnetic={false} className="p-4">
        {mode === "foto" ? <PhotoCapture sample={sample} onAdd={onAdd} /> : <ManualForm today={today} onAdd={onAdd} />}
      </GlassTile>
      <p data-tile className="px-2 text-center text-xs text-slate-500">
        Kamera und Erkennung sind in diesem Prototyp nur simuliert.
      </p>
    </div>
  );
}
