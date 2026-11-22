"use client";

import { useMemo, useState } from "react";
import { ampelWithRules } from "@/lib/ampel-rules";
import type { DashboardData } from "@/lib/dashboard-data";
import { DEFAULT_HOUSEHOLD_RULES, goalSettingsFrom } from "@/lib/mock-settings";
import type { RestockItem } from "@/lib/types";
import { computeLiveSupply } from "./live-supply";
import { useDiet } from "./use-diet";
import { usePatch } from "./use-patch";
import { useStock } from "./use-stock";

/** Lokaler Vorrats-, Historien-, Haushalts- und Ziel-State; alle Kennzahlen werden bei jeder Änderung neu berechnet. */
export function useCockpit(data: DashboardData) {
  const [restock, setRestock] = useState<RestockItem[]>(data.restock);
  const [checkedIn, setCheckedIn] = useState(false);
  const [goal, patchGoal] = usePatch(goalSettingsFrom(data.goal));
  const [rules, patchRules] = usePatch(DEFAULT_HOUSEHOLD_RULES);
  const stock = useStock(data.products, data.today);
  const diet = useDiet(data.members, data.householdDiet);
  const { products } = stock;
  const { members, householdDiet } = diet;
  const { today } = data;

  const live = useMemo(
    () => computeLiveSupply({ products, members, householdDiet, goal, today, ampelRules: rules.ampel }),
    [products, members, householdDiet, goal, today, rules.ampel],
  );

  // checkInStreak ist -1, wenn nie ausgelassen wurde: dann zählt die ganze Reihe.
  const baseStreak = data.checkInStreak < 0 ? data.checkIns.length : data.checkInStreak;

  return {
    stock,
    products,
    restock,
    live,
    diet,
    goal,
    patchGoal,
    rules,
    patchRules,
    ampelOf: (mhd: string) => ampelWithRules(mhd, today, rules.ampel),
    checkedIn,
    streak: baseStreak + (checkedIn ? 1 : 0),
    openRestock: restock.filter((item) => !item.done),
    toggleRestock: (id: string) =>
      setRestock((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))),
    checkIn: () => setCheckedIn(true),
  };
}

export type Cockpit = ReturnType<typeof useCockpit>;
export type LiveSupply = Cockpit["live"];
