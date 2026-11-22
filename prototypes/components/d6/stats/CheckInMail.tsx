import { Mail } from "lucide-react";
import type { ExpiringUnit } from "@/lib/supply";
import { formatDate } from "@/lib/supply";
import { formatNumber } from "../data/format";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, MONO } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";

const PREVIEW_ROWS = 3;

interface CheckInMailProps {
  greeting: string;
  suppliedDays: number;
  expiring: ExpiringUnit[];
  openRestock: number;
  checkedIn: boolean;
  onCheckIn: () => void;
  onOpenStock: () => void;
}

/** Vorschau der wöchentlichen Check-in-Mail, gebaut aus den Live-Daten. */
export function CheckInMail({ greeting, suppliedDays, expiring, openRestock, checkedIn, onCheckIn, onOpenStock }: CheckInMailProps) {
  const firstByName = new Map<string, string>();
  for (const entry of expiring) if (!firstByName.has(entry.product.name)) firstByName.set(entry.product.name, entry.unit.mhd);
  const rows = [...firstByName].slice(0, PREVIEW_ROWS);

  return (
    <GlassTile label="Vorschau Check-in-Mail" className="col-span-2 md:col-span-4">
      <article className="overflow-hidden rounded-2xl border border-(--d6-line) bg-(--d6-glass-strong)">
        <header className="flex items-center gap-3 border-b border-(--d6-line) px-4 py-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-(--d6-accent-soft) text-(--d6-accent-text)">
            <Mail size={16} />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold">Wie sieht’s aus? Dein Vorrats-Check</p>
            <p className={`${MONO} truncate text-[11px] text-(--d6-subtle)`}>Preposaurus · jeden Samstag</p>
          </div>
        </header>
        <div className="space-y-3 px-4 py-4 text-sm leading-relaxed">
          <p>Hallo {greeting},</p>
          <p>
            ihr seid gerade für <strong>{formatNumber(suppliedDays, 1)} Tage</strong> versorgt.
            {rows.length > 0 ? " Diese Dinge möchten bald gegessen werden:" : " Alles im grünen Bereich."}
          </p>
          {rows.length > 0 && (
            <ul className="space-y-1">
              {rows.map(([name, mhd]) => (
                <li key={name} className="flex justify-between gap-3 rounded-xl bg-(--d6-track) px-3 py-1.5">
                  <span>{name}</span>
                  <span className={`${MONO} text-(--d6-muted)`}>{formatDate(mhd)}</span>
                </li>
              ))}
            </ul>
          )}
          {openRestock > 0 && <p>Auf der Nachkaufen-Liste stehen {openRestock} Dinge.</p>}
          <p className="text-(--d6-muted)">Hat sich etwas geändert? Ein Tipp genügt.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onCheckIn} disabled={checkedIn} className={BUTTON_PRIMARY}>
              {checkedIn ? "Danke, bis nächste Woche" : "Alles wie gehabt"}
            </button>
            <button type="button" onClick={onOpenStock} className={BUTTON_SECONDARY}>
              Ich habe etwas entnommen
            </button>
          </div>
        </div>
      </article>
    </GlassTile>
  );
}
