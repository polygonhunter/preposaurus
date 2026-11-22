"use client";

import { useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { Flip, gsap, useGSAP } from "./gsap";
import { isReducedMotion } from "./motion";
import { ProductTile } from "./ProductTile";
import { StockFilters, type CategoryFilter, type ContainerFilter } from "./StockFilters";

interface StockScreenProps {
  products: Product[];
  today: string;
  onTake: (productId: string) => void;
}

export function StockScreen({ products, today, onTake }: StockScreenProps) {
  const [category, setCategory] = useState<CategoryFilter>("alle");
  const [container, setContainer] = useState<ContainerFilter>("alle");
  const gridRef = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const visible = products.filter(
    (p) => (category === "alle" || p.category === category) && (container === "alle" || p.container === container),
  );
  const unitCount = visible.reduce((sum, p) => sum + p.units.length, 0);

  const captureLayout = () => {
    const tiles = gridRef.current?.querySelectorAll("[data-tile]");
    if (tiles) flipState.current = Flip.getState(tiles);
  };

  useGSAP(() => {
    const state = flipState.current;
    flipState.current = null;
    const tiles = gridRef.current?.querySelectorAll("[data-tile]");
    if (!state || !tiles || isReducedMotion()) return;
    Flip.from(state, {
      targets: tiles,
      duration: 0.6,
      ease: "power3.inOut",
      absolute: true,
      onEnter: (entering) =>
        gsap.fromTo(entering, { autoAlpha: 0, scale: 0.85, filter: "blur(10px)" },
          { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.5, delay: 0.2, clearProps: "filter" }),
    });
  }, { dependencies: [category, container], scope: gridRef });

  return (
    <div className="space-y-4">
      <StockFilters
        products={products}
        category={category}
        container={container}
        onCategory={(value) => {
          captureLayout();
          setCategory(value);
        }}
        onContainer={(value) => {
          captureLayout();
          setContainer(value);
        }}
      />
      <p className="px-1 text-xs text-slate-500">
        {visible.length} Produkte · {unitCount} Einheiten · frühestes MHD wird zuerst entnommen
      </p>
      <div ref={gridRef} className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {visible.map((product) => (
          <ProductTile key={product.id} product={product} today={today} onTake={onTake} />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="rounded-3xl bg-white/50 p-6 text-center text-sm text-slate-600">Für diese Auswahl ist nichts im Vorrat.</p>
      )}
    </div>
  );
}
