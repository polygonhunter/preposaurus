"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { CategoryKey, Container, Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { StockFilters } from "./StockFilters";

interface StockScreenProps {
  products: Product[];
  today: string;
  onTakeOne: (productId: string) => void;
}

/** Vorrat: filterbare Produktliste mit „1 entnehmen“. */
export function StockScreen({ products, today, onTakeOne }: StockScreenProps) {
  const [category, setCategory] = useState<CategoryKey | null>(null);
  const [container, setContainer] = useState<Container | null>(null);

  const categories = useMemo(
    () => CATEGORIES.map((c) => c.key).filter((key) => products.some((p) => p.category === key)),
    [products],
  );
  const containers = useMemo(() => [...new Set(products.map((p) => p.container))], [products]);
  const visible = products.filter(
    (p) => (!category || p.category === category) && (!container || p.container === container),
  );
  const unitCount = visible.reduce((sum, p) => sum + p.units.length, 0);

  return (
    <div className="space-y-4 pt-1">
      <div data-pop>
        <h1 className="font-[family-name:var(--font-d5-display)] text-3xl font-extrabold">Dein Vorrat 🧺</h1>
        <p className="text-sm font-bold text-(--d5-muted)">
          {visible.length} Produkte · {unitCount} Packungen
        </p>
      </div>
      <StockFilters
        categories={categories}
        containers={containers}
        category={category}
        container={container}
        onCategory={setCategory}
        onContainer={setContainer}
      />
      {visible.length === 0 ? (
        <p className="rounded-3xl bg-(--d5-soft) p-6 text-center font-bold text-(--d5-muted)">
          🤷 Hier ist noch nichts. Probier einen anderen Filter.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} today={today} onTakeOne={onTakeOne} />
          ))}
        </ul>
      )}
    </div>
  );
}
