"use client";

import { useState } from "react";
import { Camera, PenLine } from "lucide-react";
import type { Product } from "@/lib/types";
import type { StockDraft, StockProduct } from "../data/stock";
import { GlassTile } from "../ui/GlassTile";
import { SegmentedControl } from "../ui/SegmentedControl";
import { ManualForm } from "./ManualForm";
import { PhotoCapture } from "./PhotoCapture";

type AddMode = "foto" | "manuell";

interface AddScreenProps {
  sample: Product;
  today: string;
  products: StockProduct[];
  onAdd: (draft: StockDraft) => void;
}

export function AddScreen({ sample, today, products, onAdd }: AddScreenProps) {
  const [mode, setMode] = useState<AddMode>("foto");

  return (
    <div className="mx-auto max-w-lg space-y-3">
      <div data-tile className="flex justify-center">
        <SegmentedControl
          label="Erfassungsart"
          value={mode}
          onChange={setMode}
          className="w-full max-w-xs"
          options={[
            { key: "foto", label: "Foto", icon: Camera },
            { key: "manuell", label: "Manuell", icon: PenLine },
          ]}
        />
      </div>
      <GlassTile>
        {mode === "foto" ? (
          <PhotoCapture sample={sample} products={products} onAdd={onAdd} />
        ) : (
          <ManualForm today={today} products={products} onAdd={onAdd} />
        )}
      </GlassTile>
      <p data-tile className="px-2 text-center text-xs text-(--d6-subtle)">
        Kamera und Erkennung sind in diesem Prototyp nur simuliert.
      </p>
    </div>
  );
}
