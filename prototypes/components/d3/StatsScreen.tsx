import type { DashboardData } from "@/lib/dashboard-data";
import { CheckInMail } from "./CheckInMail";
import { CountUp } from "./CountUp";
import { GlassTile } from "./GlassTile";
import { OverallTile } from "./OverallTile";
import { formatDayMonth } from "./stock";
import { StreakTile } from "./StreakTile";
import { LABEL } from "./styles";
import type { LiveSupply } from "./use-live-supply";
import { WasteTile } from "./WasteTile";

interface StatsScreenProps {
  data: DashboardData;
  live: LiveSupply;
  checkedIn: boolean;
  onCheckIn: () => void;
  onOpenStock: () => void;
}

export function StatsScreen({ data, live, checkedIn, onCheckIn, onOpenStock }: StatsScreenProps) {
  const baseStreak = data.checkInStreak < 0 ? data.checkIns.length : data.checkInStreak;
  const streak = baseStreak + (checkedIn ? 1 : 0);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <OverallTile percent={live.overallPercent} />
      <GlassTile className="flex flex-col justify-between">
        <span className={LABEL}>Durchhaltbar</span>
        <div className="space-y-2">
          <p>
            <CountUp value={live.suppliedToday.days} digits={1} className="text-4xl font-extralight tracking-tight" />
            <span className="text-sm text-slate-500"> Tage heute</span>
          </p>
          <p className="text-sm text-slate-600">
            <CountUp value={live.suppliedAtGoal.days} digits={1} className="font-semibold" /> Tage am {formatDayMonth(data.goal.targetDate)}
          </p>
        </div>
      </GlassTile>
      <StreakTile checkIns={data.checkIns} streak={streak} />
      <WasteTile waste={data.waste} />
      <CheckInMail data={data} live={live} checkedIn={checkedIn} onCheckIn={onCheckIn} onOpenStock={onOpenStock} />
    </div>
  );
}
