import type { DashboardData } from "@/lib/dashboard-data";
import { formatDate } from "@/lib/supply";
import type { LiveSupply } from "../useLiveSupply";
import { CategoryJars } from "./CategoryJars";
import { ExpiryNotice } from "./ExpiryNotice";
import { HeroCard } from "./HeroCard";
import { MembersRow } from "./MembersRow";
import { ScoreCard } from "./ScoreCard";

interface OverviewScreenProps {
  data: DashboardData;
  live: LiveSupply;
}

/** Startseite: Versorgung, Gesamt-Score, Gläser je Warengruppe, Team, Ablauf-Hinweis. */
export function OverviewScreen({ data, live }: OverviewScreenProps) {
  return (
    <div className="space-y-5 pt-1">
      <HeroCard goal={data.goal} suppliedToday={live.suppliedToday} suppliedAtGoal={live.suppliedAtGoal} />
      <ScoreCard overallPercent={live.overallPercent} badgeCount={live.badges.length} />
      <CategoryJars
        today={live.progressToday}
        atGoal={live.progressGoal}
        goalLabel={formatDate(data.goal.targetDate).slice(0, 6)}
      />
      <MembersRow members={data.members} />
      <ExpiryNotice items={live.expiringBeforeGoal} goalDate={data.goal.targetDate} />
    </div>
  );
}
