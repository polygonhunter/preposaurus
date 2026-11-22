import { formatDate } from "@/lib/supply";
import { getCategory } from "@/lib/categories";
import { AmpelDot } from "./AmpelDot";
import { GlassTile, TileOpenButton } from "./GlassTile";
import { LABEL } from "./styles";
import type { LiveSupply } from "./use-live-supply";

const MAX_ROWS = 4;

interface ExpiringTileProps {
  live: LiveSupply;
  targetDate: string;
  onOpen: (tile: HTMLElement | null) => void;
}

function daysText(daysLeft: number): string {
  if (daysLeft < 0) return `seit ${-daysLeft} Tagen abgelaufen`;
  return `noch ${daysLeft} Tage`;
}

/** Einheiten, die vor dem Zieldatum ablaufen – gruppiert nach Produkt und Datum. */
export function ExpiringTile({ live, targetDate, onOpen }: ExpiringTileProps) {
  const groups = new Map<string, { entry: LiveSupply["expiring"][number]; count: number }>();
  live.expiring
    .filter((e) => e.unit.mhd < targetDate)
    .forEach((entry) => {
      const key = `${entry.product.id}-${entry.unit.mhd}`;
      const existing = groups.get(key);
      groups.set(key, { entry, count: (existing?.count ?? 0) + 1 });
    });
  const rows = [...groups.entries()].slice(0, MAX_ROWS);

  return (
    <GlassTile flipId="tile-vorrat" className="col-span-2">
      <div className="flex items-start justify-between">
        <div>
          <span className={LABEL}>Läuft vor dem Zieldatum ab</span>
          <p className="mt-0.5 text-xs text-slate-500">Am besten bald verbrauchen und nachkaufen.</p>
        </div>
        <TileOpenButton label="Vorrat öffnen" onOpen={onOpen} />
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-600">Alles hält bis zum Zieldatum. Schön!</p>
      ) : (
        <ul className="mt-3 divide-y divide-slate-900/5">
          {rows.map(([key, { entry, count }]) => (
            <li key={key} className="flex items-center gap-3 py-2.5">
              <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-white/70 text-lg">
                {getCategory(entry.product.category).emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{count} × {entry.product.name}</p>
                <p className="text-[11px] text-slate-500">
                  {formatDate(entry.unit.mhd)} · {daysText(entry.daysLeft)}
                </p>
              </div>
              <AmpelDot ampel={entry.ampel} />
            </li>
          ))}
        </ul>
      )}
    </GlassTile>
  );
}
