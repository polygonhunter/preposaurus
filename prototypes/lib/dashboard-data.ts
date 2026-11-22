import { CHECK_INS, GOAL, HOUSEHOLD_DIET, MEMBERS, PRODUCTS, RESTOCK, TODAY, WASTE_STATS } from "./mock-data";
import { categoryProgress, expiringSoon, overallPercent, suppliedDays } from "./supply";

/** Gebündelte, abgeleitete Prototyp-Daten für alle Designs. */
export function getDashboardData() {
  const progressGoal = categoryProgress(PRODUCTS, MEMBERS, GOAL.days, GOAL.targetDate);
  return {
    today: TODAY,
    goal: GOAL,
    members: MEMBERS,
    householdDiet: HOUSEHOLD_DIET,
    products: PRODUCTS,
    restock: RESTOCK,
    checkIns: CHECK_INS,
    waste: WASTE_STATS,
    suppliedToday: suppliedDays(PRODUCTS, MEMBERS, TODAY),
    suppliedAtGoal: suppliedDays(PRODUCTS, MEMBERS, GOAL.targetDate),
    progressToday: categoryProgress(PRODUCTS, MEMBERS, GOAL.days, TODAY),
    progressGoal,
    overallPercent: overallPercent(progressGoal),
    expiring: expiringSoon(PRODUCTS, TODAY),
    checkInStreak: CHECK_INS.slice().reverse().findIndex((c) => !c.done),
  };
}

export type DashboardData = ReturnType<typeof getDashboardData>;
