import type { DashboardData } from "@/lib/dashboard-data";
import { CountUp } from "../ui/CountUp";
import type { LiveSupply } from "../useLiveSupply";
import { BadgeShelf } from "./BadgeShelf";
import { CheckInMail } from "./CheckInMail";
import { StreakFlames } from "./StreakFlames";
import { WasteCompare } from "./WasteCompare";

interface StatsScreenProps {
  data: DashboardData;
  live: LiveSupply;
}

/** Statistik & Check-in: Kennzahlen, Serie, Rotation, Abzeichen, Mail-Vorschau. */
export function StatsScreen({ data, live }: StatsScreenProps) {
  const { energyDays, waterDays, days } = live.suppliedToday;

  return (
    <div className="space-y-4 pt-1">
      <h1 data-pop className="font-[family-name:var(--font-d5-display)] text-3xl font-extrabold">
        Deine Statistik 📊
      </h1>
      <div className="grid grid-cols-2 gap-3">
        <section data-pop className="rounded-3xl bg-[#9B6BFF] p-4 text-white shadow-[0_5px_0_#7444E0]">
          <p className="text-xs font-extrabold opacity-85">Erfüllungsgrad</p>
          <p className="font-[family-name:var(--font-d5-display)] text-4xl font-extrabold">
            <CountUp value={live.overallPercent} suffix=" %" />
          </p>
        </section>
        <section data-pop className="rounded-3xl bg-[#3BA9F5] p-4 text-white shadow-[0_5px_0_#1F86D0]">
          <p className="text-xs font-extrabold opacity-85">Durchhaltbar</p>
          <p className="font-[family-name:var(--font-d5-display)] text-4xl font-extrabold">
            <CountUp value={days} decimals={1} />
            <span className="ml-1 text-lg">Tage</span>
          </p>
          <p className="text-[11px] font-bold opacity-90">
            ⚡ {energyDays.toLocaleString("de-DE")} · 💧 {waterDays.toLocaleString("de-DE")}
          </p>
        </section>
      </div>
      <StreakFlames checkIns={data.checkIns} streak={live.streak} />
      <WasteCompare consumedKg={data.waste.consumedKg} wastedKg={data.waste.wastedKg} />
      <BadgeShelf progress={live.progressToday} />
      <CheckInMail name={data.members[0]?.name ?? ""} suppliedDays={days} expiring={live.expiring} />
    </div>
  );
}
