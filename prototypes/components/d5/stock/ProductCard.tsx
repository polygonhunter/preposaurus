"use client";

import { useRef, type MouseEvent } from "react";
import { getCategory, CONTAINER_LABELS } from "@/lib/categories";
import { ampelFor, formatAmount, formatDate } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { bounce, gsap, onMotion, prefersReducedMotion, useGSAP } from "../motion";
import { CATEGORY_TONE, TONES } from "../theme";
import { AmpelBadge } from "../ui/AmpelBadge";
import { ChunkyButton } from "../ui/ChunkyButton";

interface ProductCardProps {
  product: Product;
  today: string;
  onTakeOne: (productId: string) => void;
}

function earliestMhd(product: Product): string | undefined {
  return product.units.reduce<string | undefined>((min, u) => (!min || u.mhd < min ? u.mhd : min), undefined);
}

/** Produktkarte: Piktogramm, Menge, Ampel; orange/rote Karten wackeln sanft. */
export function ProductCard({ product, today, onTakeOne }: ProductCardProps) {
  const card = useRef<HTMLLIElement>(null);
  const mhd = earliestMhd(product);
  const ampel = mhd ? ampelFor(mhd, today) : undefined;
  const needsAttention = ampel === "orange" || ampel === "rot";
  const category = getCategory(product.category);
  const tone = TONES[CATEGORY_TONE[product.category]];

  const { contextSafe } = useGSAP(
    () => {
      if (!needsAttention) return;
      return onMotion(card.current, () => {
        gsap.to(".pictogram", {
          keyframes: { rotation: [0, -12, 10, -6, 4, 0] },
          duration: 0.7,
          repeat: -1,
          repeatDelay: 2.4,
          ease: "power1.inOut",
        });
      });
    },
    { scope: card, dependencies: [needsAttention], revertOnUpdate: true },
  );

  const take = contextSafe((event: MouseEvent<HTMLButtonElement>) => {
    onTakeOne(product.id);
    bounce(event.currentTarget.closest("li"), 0.92);
    if (prefersReducedMotion()) return;
    gsap.fromTo(".minus-one", { y: 0, opacity: 1, scale: 0.6 }, { y: -36, opacity: 0, scale: 1.3, duration: 0.9, ease: "power2.out" });
  });

  return (
    <li
      ref={card}
      data-pop
      className="relative flex items-center gap-3 rounded-3xl border-2 border-(--d5-line) bg-white p-3 shadow-[0_4px_0_var(--d5-line)]"
    >
      <span
        className="pictogram grid size-14 shrink-0 place-items-center rounded-2xl text-3xl"
        style={{ background: `${tone.fill}33`, boxShadow: `inset 0 -4px 0 ${tone.fill}55` }}
        aria-hidden
      >
        {category.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-black">{product.name}</p>
        <p className="text-sm font-bold text-(--d5-muted)">
          {product.units.length} × {formatAmount(product.contentPerUnit, product.unit)} · {CONTAINER_LABELS[product.container]}
        </p>
        <div className="mt-1">
          {ampel && mhd ? <AmpelBadge ampel={ampel} detail={formatDate(mhd)} /> : <span className="text-xs font-bold text-(--d5-muted)">Leer – Zeit zum Nachkaufen</span>}
        </div>
      </div>
      <div className="relative">
        <span aria-hidden className="minus-one pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 font-black text-[#D63A40] opacity-0">
          −1
        </span>
        <ChunkyButton tone="orange" size="sm" onClick={take} disabled={product.units.length === 0} aria-label={`1 ${product.name} entnehmen`}>
          1 entnehmen
        </ChunkyButton>
      </div>
    </li>
  );
}
