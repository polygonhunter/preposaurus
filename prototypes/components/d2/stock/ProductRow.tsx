"use client";

import { useRef } from "react";
import { MapPin, PackageMinus } from "lucide-react";
import { getCategory, CONTAINER_LABELS } from "@/lib/categories";
import { ampelFor, formatDate } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { quantityLabel, sortedUnits } from "../format";
import { AmpelDot } from "../ui/AmpelDot";
import { AMPEL_STYLE, MONO } from "../theme";

interface ProductRowProps {
  product: Product;
  today: string;
  onTake: (row: HTMLElement | null) => void;
}

/** Produktzeile: Piktogramm, Menge, MHD-Ampel je Einheit und „1 entnehmen“ (FIFO). */
export function ProductRow({ product, today, onTake }: ProductRowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  const units = sortedUnits(product.units);
  const earliest = units[0];
  const category = getCategory(product.category);

  return (
    <li
      ref={rowRef}
      className="rounded-2xl border border-white/[0.07] bg-(--d2-panel)/90 p-3 transition-colors hover:border-(--d2-accent)/30"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-transparent text-2xl"
        >
          {category.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="truncate font-medium text-zinc-100">{product.name}</h3>
            <span className={`${MONO} shrink-0 text-sm text-zinc-200`}>{quantityLabel(product)}</span>
          </div>
          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
            {CONTAINER_LABELS[product.container]}
            <span className="flex items-center gap-0.5">
              <MapPin className="size-3" /> {product.location}
            </span>
          </p>
          {earliest ? (
            <p className="mt-1.5 flex items-center gap-2 text-xs">
              <AmpelDot ampel={ampelFor(earliest.mhd, today)} showLabel />
              <span className={`${MONO} text-zinc-400`}>ab {formatDate(earliest.mhd)}</span>
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-zinc-500">Aufgebraucht – Zeit zum Nachkaufen.</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-1" aria-label="MHD je Einheit">
          {units.map((unit) => {
            const { color } = AMPEL_STYLE[ampelFor(unit.mhd, today)];
            return <li key={unit.id} title={formatDate(unit.mhd)} className="h-3 w-1.5 rounded-sm" style={{ background: color, opacity: 0.85 }} />;
          })}
        </ul>
        <button
          type="button"
          disabled={!earliest}
          onClick={() => onTake(rowRef.current)}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-200 transition hover:border-(--d2-accent)/60 hover:text-(--d2-accent) hover:shadow-[0_0_16px_-6px_var(--d2-accent)] disabled:opacity-30"
        >
          <PackageMinus className="size-3.5" /> 1 entnehmen
        </button>
      </div>
    </li>
  );
}
