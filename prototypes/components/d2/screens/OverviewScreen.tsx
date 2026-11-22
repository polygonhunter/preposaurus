"use client";

import { useRef } from "react";
import type { DashboardData } from "@/lib/dashboard-data";
import { useScreenReveal } from "../motion";
import { CategoryBar } from "../overview/CategoryBar";
import { ExpiringPanel } from "../overview/ExpiringPanel";
import { GoalPanel } from "../overview/GoalPanel";
import { MembersStrip } from "../overview/MembersStrip";
import { SupplyGaugePanel } from "../overview/SupplyGaugePanel";
import { Panel } from "../ui/Panel";
import type { Pantry } from "../use-pantry";

interface OverviewScreenProps {
  data: DashboardData;
  pantry: Pantry;
  onOpenStock: () => void;
}

export function OverviewScreen({ data, pantry, onOpenStock }: OverviewScreenProps) {
  const scope = useRef<HTMLDivElement>(null);
  useScreenReveal(scope);
  const { supply } = pantry;

  return (
    <div ref={scope} className="grid gap-3 md:grid-cols-2">
      <SupplyGaugePanel supplied={supply.suppliedToday} goalDays={data.goal.days} />
      <div className="grid content-start gap-3">
        <GoalPanel goal={data.goal} atGoal={supply.suppliedAtGoal} overallPercent={supply.overallPercent} />
        <MembersStrip members={data.members} />
      </div>
      <Panel label={`Warengruppen · Empfehlung ${data.goal.days} Tage`} className="md:col-span-2">
        <ul className="grid gap-4 md:grid-cols-2 md:gap-x-8">
          {supply.progressGoal.map((progress) => (
            <CategoryBar key={progress.key} progress={progress} />
          ))}
        </ul>
      </Panel>
      <div className="md:col-span-2">
        <ExpiringPanel expiring={supply.expiring} targetDate={data.goal.targetDate} onOpenStock={onOpenStock} />
      </div>
    </div>
  );
}
