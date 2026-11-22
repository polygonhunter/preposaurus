"use client";

import { useRef, type MouseEvent } from "react";
import { CONTAINER_LABELS, getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { AmpelDot } from "./AmpelDot";
import { GlassTile } from "./GlassTile";
import { gsap, useGSAP } from "./gsap";
import { isReducedMotion, popFeedback } from "./motion";
import { earliestMhd, productAmpel, quantityLabel } from "./stock";

interface ProductTileProps {
  product: Product;
  today: string;
  onTake: (productId: string) => void;
}

export function ProductTile({ product, today, onTake }: ProductTileProps) {
  const scope = useRef<HTMLDivElement>(null);
  const ampel = productAmpel(product, today);
  const mhd = earliestMhd(product);
  const isEmpty = product.units.length === 0;
  const { contextSafe } = useGSAP({ scope });

  const floatMinusOne = contextSafe(() => {
    gsap.fromTo("[data-minus]", { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -28, duration: 0.9, ease: "power2.out" });
  });

  const take = (event: MouseEvent<HTMLButtonElement>) => {
    onTake(product.id);
    popFeedback(event.currentTarget.closest("[data-tile]")?.querySelector("[data-quantity]") ?? null);
    if (!isReducedMotion()) floatMinusOne();
  };

  return (
    <GlassTile flipId={product.id} className="flex flex-col">
      <div ref={scope} className="flex flex-1 flex-col">
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/80 text-2xl shadow-sm">
            {getCategory(product.category).emoji}
          </span>
          <div className="relative min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-tight">{product.name}</h3>
            <p data-quantity className="mt-0.5 origin-left text-sm tabular-nums text-slate-600">
              {quantityLabel(product.units.length, product)}
            </p>
            <span data-minus aria-hidden className="invisible absolute right-0 top-0 text-sm font-semibold text-indigo-500">
              −1
            </span>
          </div>
        </div>

        <div className="mt-3 space-y-1 text-xs">
          {ampel && mhd ? (
            <>
              <AmpelDot ampel={ampel} withLabel />
              <p className="tabular-nums text-slate-500">nächstes MHD {formatDate(mhd)}</p>
            </>
          ) : (
            <p className="text-slate-500">Aufgebraucht – Zeit zum Nachkaufen.</p>
          )}
          <p className="text-slate-400">{CONTAINER_LABELS[product.container]} · {product.location}</p>
        </div>

        <button
          type="button"
          disabled={isEmpty}
          onClick={take}
          className="mt-3 w-full rounded-full bg-slate-900/90 py-2 text-[13px] font-medium text-white transition hover:bg-slate-900 active:scale-[0.97] disabled:bg-slate-900/20"
        >
          1 entnehmen
        </button>
      </div>
    </GlassTile>
  );
}
