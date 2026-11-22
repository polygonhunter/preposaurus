"use client";

import { useRef } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { useScreenReveal } from "../motion";
import { EndurancePanel } from "../stats/EndurancePanel";
import { MailPreview } from "../stats/MailPreview";
import { StreakPanel } from "../stats/StreakPanel";
import { WastePanel } from "../stats/WastePanel";
import type { Pantry } from "../use-pantry";

interface StatsScreenProps {
  data: DashboardData;
  pantry: Pantry;
}

export function StatsScreen({ data, pantry }: StatsScreenProps) {
  const scope = useRef<HTMLDivElement>(null);
  useScreenReveal(scope);
  const { supply } = pantry;
  // checkInStreak ist -1, wenn kein Check-in ausgelassen wurde: dann zählt die ganze Reihe.
  const streak = data.checkInStreak < 0 ? data.checkIns.length : data.checkInStreak;
  const openRestock = pantry.restock.filter((item) => !item.done).length;

  return (
    <div ref={scope} className="grid gap-3 md:grid-cols-2">
      <EndurancePanel supplied={supply.suppliedToday} goalDays={data.goal.days} overallPercent={supply.overallPercent} />
      <StreakPanel checkIns={data.checkIns} streak={streak} />
      <WastePanel consumedKg={data.waste.consumedKg} wastedKg={data.waste.wastedKg} takenThisSession={pantry.takenCount} />
      <MailPreview expiring={supply.expiring} openRestock={openRestock} />
    </div>
  );
}
