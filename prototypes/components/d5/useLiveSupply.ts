import { useMemo } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { categoryProgress, expiringSoon, overallPercent, suppliedDays } from "@/lib/supply";
import type { Product } from "@/lib/types";

/**
 * Leitet die Kennzahlen mit den Funktionen aus `lib/supply` neu ab,
 * damit lokale Änderungen (entnehmen, hinzufügen) sofort sichtbar werden.
 */
export function useLiveSupply(data: DashboardData, products: Product[]) {
  return useMemo(() => {
    const { members, goal, today } = data;
    const progressGoal = categoryProgress(products, members, goal.days, goal.targetDate);
    const progressToday = categoryProgress(products, members, goal.days, today);
    const expiring = expiringSoon(products, today);
    const streak = data.checkInStreak < 0 ? data.checkIns.length : data.checkInStreak;
    return {
      suppliedToday: suppliedDays(products, members, today),
      suppliedAtGoal: suppliedDays(products, members, goal.targetDate),
      progressToday,
      progressGoal,
      overallPercent: overallPercent(progressGoal),
      expiring,
      expiringBeforeGoal: expiring.filter((e) => e.unit.mhd < goal.targetDate),
      badges: progressToday.filter((p) => p.percent >= 100),
      streak,
    };
  }, [data, products]);
}

export type LiveSupply = ReturnType<typeof useLiveSupply>;
