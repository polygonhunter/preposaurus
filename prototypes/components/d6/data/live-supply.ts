import { expiringSoonWithRules, type AmpelRules } from "@/lib/ampel-rules";
import { dietCategoryProgress } from "@/lib/diet";
import { macroDays, macroGap, macroStock } from "@/lib/nutrition";
import { overallPercent, suppliedDays } from "@/lib/supply";
import type { Diet, Goal, Member } from "@/lib/types";
import { expiringBefore, type StockProduct } from "./stock";

interface LiveInput {
  products: StockProduct[];
  members: Member[];
  householdDiet: Diet;
  goal: Goal;
  today: string;
  ampelRules: AmpelRules;
}

/** Alle Live-Kennzahlen des Cockpits aus Vorrat, Haushalt, Ernährungsform, Ziel und Ampel-Schwellen. */
export function computeLiveSupply({ products, members, householdDiet, goal, today, ampelRules }: LiveInput) {
  const progressGoal = dietCategoryProgress(products, members, householdDiet, goal.days, goal.targetDate);
  const suppliedToday = suppliedDays(products, members, today);
  const macroStockToday = macroStock(products, today);
  const macros = macroDays(macroStockToday.grams, members);
  return {
    suppliedToday,
    suppliedAtGoal: suppliedDays(products, members, goal.targetDate),
    progressToday: dietCategoryProgress(products, members, householdDiet, goal.days, today),
    progressGoal,
    overallPercent: overallPercent(progressGoal),
    expiringSoon: expiringSoonWithRules(products, today, ampelRules),
    expiringBeforeGoal: expiringBefore(products, today, goal.targetDate, ampelRules),
    macroStock: macroStockToday,
    macros,
    macroGap: macroGap(macros, suppliedToday.energyDays),
  };
}
