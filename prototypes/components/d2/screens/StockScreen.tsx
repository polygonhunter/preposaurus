"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { DashboardData } from "@/lib/dashboard-data";
import { useGlowPulse, useScreenReveal, whenMotionAllowed } from "../motion";
import { ProductRow } from "../stock/ProductRow";
import { StockFilters, applyStockFilter, type StockFilter } from "../stock/StockFilters";
import { Ticker } from "../ui/Ticker";
import { LABEL } from "../theme";
import type { Pantry } from "../use-pantry";

interface StockScreenProps {
  data: DashboardData;
  pantry: Pantry;
}

export function StockScreen({ data, pantry }: StockScreenProps) {
  const scope = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [filter, setFilter] = useState<StockFilter>({ category: null, container: null });
  const visible = applyStockFilter(pantry.products, filter);
  const unitCount = visible.reduce((sum, p) => sum + p.units.length, 0);
  const pulse = useGlowPulse(scope);
  useScreenReveal(scope);

  // Liste gleitet beim Öffnen und bei jedem Filterwechsel gestaffelt ein.
  useGSAP(
    () => {
      whenMotionAllowed(listRef, () => {
        gsap.from(listRef.current?.children ?? [], { x: -12, autoAlpha: 0, duration: 0.35, stagger: 0.03, ease: "power2.out" });
      });
    },
    { dependencies: [filter], scope: listRef, revertOnUpdate: true },
  );

  const take = (productId: string, row: HTMLElement | null) => {
    pantry.takeOne(productId);
    pulse(row);
  };

  return (
    <div ref={scope} className="grid gap-4">
      <StockFilters products={pantry.products} filter={filter} onChange={setFilter} />
      <div data-reveal className="flex items-baseline justify-between">
        <p className={LABEL}>{visible.length} Produkte</p>
        <p className="text-sm text-zinc-400">
          <Ticker value={unitCount} className="text-zinc-100" /> Einheiten
        </p>
      </div>
      <ul ref={listRef} className="grid gap-2 md:grid-cols-2">
        {visible.map((product) => (
          <ProductRow key={product.id} product={product} today={data.today} onTake={(row) => take(product.id, row)} />
        ))}
      </ul>
      {visible.length === 0 && <p className="text-center text-sm text-zinc-500">Für diesen Filter ist nichts eingelagert.</p>}
    </div>
  );
}
