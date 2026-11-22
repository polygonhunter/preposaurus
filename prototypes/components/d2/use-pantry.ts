"use client";

import { useMemo, useState } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { categoryProgress, expiringSoon, overallPercent, suppliedDays } from "@/lib/supply";
import type { Product, RestockItem } from "@/lib/types";
import { sortedUnits } from "./format";

function withoutEarliestUnit(product: Product): Product {
  const [earliest] = sortedUnits(product.units);
  return { ...product, units: product.units.filter((u) => u.id !== earliest?.id) };
}

function mergeProduct(products: Product[], incoming: Product): Product[] {
  const exists = products.some((p) => p.id === incoming.id);
  if (!exists) return [...products, incoming];
  return products.map((p) => (p.id === incoming.id ? { ...p, units: [...p.units, ...incoming.units] } : p));
}

/** Lokaler Vorrats-State plus live neu berechnete Kennzahlen aus lib/supply. */
export function usePantry(data: DashboardData) {
  const [products, setProducts] = useState(data.products);
  const [restock, setRestock] = useState<RestockItem[]>(data.restock);
  const [takenCount, setTakenCount] = useState(0);

  const supply = useMemo(() => {
    const { members, today, goal } = data;
    const progressGoal = categoryProgress(products, members, goal.days, goal.targetDate);
    return {
      suppliedToday: suppliedDays(products, members, today),
      suppliedAtGoal: suppliedDays(products, members, goal.targetDate),
      progressGoal,
      overallPercent: overallPercent(progressGoal),
      expiring: expiringSoon(products, today),
    };
  }, [products, data]);

  return {
    products,
    restock,
    takenCount,
    supply,
    takeOne: (productId: string) => {
      setProducts((list) => list.map((p) => (p.id === productId ? withoutEarliestUnit(p) : p)));
      setTakenCount((n) => n + 1);
    },
    addProduct: (product: Product) => setProducts((list) => mergeProduct(list, product)),
    toggleRestock: (id: string) =>
      setRestock((items) => items.map((item) => (item.id === id ? { ...item, done: !item.done } : item))),
  };
}

export type Pantry = ReturnType<typeof usePantry>;
