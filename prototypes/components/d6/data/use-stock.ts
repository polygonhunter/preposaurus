"use client";

import { useState } from "react";
import { resolveUnit, type HistoryEntry, type UnitChecks, type UnitOutcome } from "@/lib/unit-history";
import { addStock, type StockDraft, type StockProduct } from "./stock";

/** Lokaler Vorrat mit Historie: verbrauchte/entsorgte Einheiten wandern in `history` statt gelöscht zu werden. */
export function useStock(initial: StockProduct[], today: string) {
  const [products, setProducts] = useState<StockProduct[]>(initial);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [checks, setChecks] = useState<UnitChecks>({});
  const [addCount, setAddCount] = useState(0);

  const resolve = (productId: string, unitId: string, outcome: UnitOutcome) => {
    const result = resolveUnit(products, { productId, unitId, outcome, date: today });
    const { entry } = result;
    if (!entry) return;
    setProducts(result.products);
    setHistory((prev) => [entry, ...prev]);
  };

  return {
    products,
    history,
    checks,
    resolve,
    markChecked: (unitId: string) => setChecks((prev) => ({ ...prev, [unitId]: today })),
    addDraft: (draft: StockDraft) => {
      setProducts((prev) => addStock(prev, draft, addCount));
      setAddCount((n) => n + 1);
    },
  };
}
