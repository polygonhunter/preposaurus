import { useMemo } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { categoryProgress, expiringSoon, overallPercent, suppliedDays } from "@/lib/supply";
import type { Product } from "@/lib/types";

/** Leitet die Versorgungswerte aus dem lokalen Vorrat neu ab, damit Aktionen sofort sichtbar werden. */
export function useLiveSupply(data: DashboardData, products: Product[]) {
  return useMemo(() => {
    const { members, goal, today } = data;
    const progressGoal = categoryProgress(products, members, goal.days, goal.targetDate);
    return {
      suppliedToday: suppliedDays(products, members, today),
      suppliedAtGoal: suppliedDays(products, members, goal.targetDate),
      progressToday: categoryProgress(products, members, goal.days, today),
      progressGoal,
      overallPercent: overallPercent(progressGoal),
      expiring: expiringSoon(products, today),
    };
  }, [data, products]);
}

export type LiveSupply = ReturnType<typeof useLiveSupply>;
