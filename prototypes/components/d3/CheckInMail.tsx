import { Mail } from "lucide-react";
import type { DashboardData } from "@/lib/dashboard-data";
import { formatDate } from "@/lib/supply";
import { GlassTile } from "./GlassTile";
import { formatNumber } from "./stock";
import { LABEL, PRIMARY_BUTTON } from "./styles";
import type { LiveSupply } from "./use-live-supply";

const PREVIEW_ROWS = 3;

interface CheckInMailProps {
  data: DashboardData;
  live: LiveSupply;
  checkedIn: boolean;
  onCheckIn: () => void;
  onOpenStock: () => void;
}

/** Vorschau der wöchentlichen Check-in-Mail. */
export function CheckInMail({ data, live, checkedIn, onCheckIn, onOpenStock }: CheckInMailProps) {
  const soon = live.expiring.filter((e) => e.daysLeft >= 0);
  const names = [...new Set(soon.map((e) => e.product.name))].slice(0, PREVIEW_ROWS);
  const firstDue = (name: string) => soon.find((e) => e.product.name === name)?.unit.mhd ?? data.today;
  const greeting = data.members.find((m) => m.kind === "erwachsen")?.name ?? "";

  return (
    <GlassTile className="col-span-2 md:col-span-4">
      <span className={LABEL}>Vorschau Check-in-Mail</span>
      <article className="mt-3 overflow-hidden rounded-2xl bg-white/85 shadow-sm">
        <header className="flex items-center gap-3 border-b border-slate-900/5 px-4 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-indigo-100 text-indigo-600"><Mail size={16} /></span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Wie sieht’s aus? Dein Vorrats-Check</p>
            <p className="truncate text-xs text-slate-500">Preposaurus · jeden Samstag</p>
          </div>
        </header>
        <div className="space-y-3 px-4 py-4 text-sm leading-relaxed text-slate-700">
          <p>Hallo {greeting},</p>
          <p>
            ihr seid gerade für <strong>{formatNumber(live.suppliedToday.days, 1)} Tage</strong> versorgt. Diese Dinge
            möchten bald gegessen werden:
          </p>
          <ul className="space-y-1">
            {names.map((name) => (
              <li key={name} className="flex justify-between rounded-xl bg-slate-900/[0.03] px-3 py-1.5">
                <span>{name}</span>
                <span className="tabular-nums text-slate-500">{formatDate(firstDue(name))}</span>
              </li>
            ))}
          </ul>
          <p>Hat sich etwas geändert? Ein Tipp genügt.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCheckIn} disabled={checkedIn} className={PRIMARY_BUTTON}>
              {checkedIn ? "Danke, bis nächste Woche" : "Alles wie gehabt"}
            </button>
            <button type="button" onClick={onOpenStock} className="rounded-full bg-slate-900/5 px-5 py-3 text-sm font-medium">
              Ich habe etwas entnommen
            </button>
          </div>
        </div>
      </article>
    </GlassTile>
  );
}
