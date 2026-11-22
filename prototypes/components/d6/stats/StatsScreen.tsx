import type { DashboardData } from "@/lib/dashboard-data";
import type { Cockpit } from "../data/use-cockpit";
import { CheckInMail } from "./CheckInMail";
import { EnduranceTile } from "./EnduranceTile";
import { MacroShareTile } from "./MacroShareTile";
import { StreakTile } from "./StreakTile";
import { WasteTile } from "./WasteTile";

interface StatsScreenProps {
  data: DashboardData;
  cockpit: Cockpit;
  onOpenStock: () => void;
}

export function StatsScreen({ data, cockpit, onOpenStock }: StatsScreenProps) {
  const { live } = cockpit;
  const greeting = data.members.find((m) => m.kind === "erwachsen")?.name ?? "";

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <EnduranceTile goal={cockpit.goal} live={live} />
      <MacroShareTile live={live} members={cockpit.diet.members} />
      <StreakTile checkIns={data.checkIns} streak={cockpit.streak} checkedIn={cockpit.checkedIn} />
      <WasteTile waste={data.waste} history={cockpit.stock.history} />
      <CheckInMail
        greeting={greeting}
        suppliedDays={live.suppliedToday.days}
        expiring={live.expiringSoon}
        openRestock={cockpit.openRestock.length}
        checkedIn={cockpit.checkedIn}
        onCheckIn={cockpit.checkIn}
        onOpenStock={onOpenStock}
      />
    </div>
  );
}
