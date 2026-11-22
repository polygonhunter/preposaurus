import { useCallback, useState } from "react";
import type { Product, RestockItem, StockUnit } from "@/lib/types";

/** Entfernt die Einheit mit dem frühesten MHD (FIFO). */
function withoutEarliest(units: StockUnit[]): StockUnit[] {
  if (units.length === 0) return units;
  const earliest = units.reduce((min, u) => (u.mhd < min.mhd ? u : min));
  return units.filter((u) => u.id !== earliest.id);
}

/** Lokaler Prototyp-State für Vorrat und Nachkaufliste. */
export function useStock(initialProducts: Product[], initialRestock: RestockItem[]) {
  const [products, setProducts] = useState(initialProducts);
  const [restock, setRestock] = useState(initialRestock);

  const takeOne = useCallback((productId: string) => {
    setProducts((list) => list.map((p) => (p.id === productId ? { ...p, units: withoutEarliest(p.units) } : p)));
  }, []);

  const addProduct = useCallback((product: Product) => {
    setProducts((list) => [product, ...list]);
  }, []);

  const toggleRestock = useCallback((itemId: string) => {
    setRestock((list) => list.map((r) => (r.id === itemId ? { ...r, done: !r.done } : r)));
  }, []);

  return { products, restock, takeOne, addProduct, toggleRestock };
}
