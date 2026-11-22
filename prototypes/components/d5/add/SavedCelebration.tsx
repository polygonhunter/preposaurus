"use client";

import { useRef } from "react";
import { getCategory } from "@/lib/categories";
import { formatAmount } from "@/lib/supply";
import type { Product } from "@/lib/types";
import { gsap, onMotion, useGSAP } from "../motion";
import { CARD } from "../theme";
import { ChunkyButton } from "../ui/ChunkyButton";

interface SavedCelebrationProps {
  product: Product;
  onAnother: () => void;
  onDone: () => void;
}

/** Erfolgskarte nach dem Speichern mit hüpfendem Emoji. */
export function SavedCelebration({ product, onAnother, onDone }: SavedCelebrationProps) {
  const scope = useRef<HTMLElement>(null);

  useGSAP(
    () =>
      onMotion(scope.current, () => {
        gsap.from(".hero-emoji", { scale: 0, rotation: -40, duration: 1, ease: "elastic.out(1.2, 0.35)" });
        gsap.to(".hero-emoji", { y: -10, duration: 0.6, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1 });
      }),
    { scope },
  );

  return (
    <section ref={scope} className={`${CARD} space-y-3 p-6 text-center`}>
      <p className="hero-emoji inline-block text-7xl" aria-hidden>
        {getCategory(product.category).emoji}
      </p>
      <h2 className="font-[family-name:var(--font-d5-display)] text-3xl font-extrabold">Eingeräumt! 🎉</h2>
      <p className="font-bold text-(--d5-muted)">
        {product.units.length} × {product.name} {formatAmount(product.contentPerUnit, product.unit)} liegen jetzt in deinem Vorrat.
      </p>
      <div className="grid gap-3 pt-2">
        <ChunkyButton tone="orange" size="lg" onClick={onDone}>
          Zum Vorrat
        </ChunkyButton>
        <ChunkyButton tone="blue" size="lg" onClick={onAnother}>
          Noch etwas erfassen
        </ChunkyButton>
      </div>
    </section>
  );
}
