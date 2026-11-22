import { getCategory } from "@/lib/categories";
import { formatDate } from "@/lib/supply";
import { daysLeftLabel } from "../data/format";
import { groupExpiring } from "../data/stock";
import type { LiveSupply } from "../data/use-cockpit";
import { MONO } from "../theme/styles";
import { AmpelDot } from "../ui/Controls";
import { GlassTile, TileOpenButton } from "../ui/GlassTile";

const MAX_ROWS = 4;

interface ExpiringTileProps {
  live: LiveSupply;
  onOpen: (tile: HTMLElement | null) => void;
}

/** Alle Einheiten mit MHD vor dem Zieldatum, gruppiert nach Produkt und Datum. */
export function ExpiringTile({ live, onOpen }: ExpiringTileProps) {
  const groups = groupExpiring(live.expiringBeforeGoal);
  const rows = groups.slice(0, MAX_ROWS);
  const hidden = groups.length - rows.length;

  return (
    <GlassTile flipId="tile-vorrat" label="Läuft vor Zieldatum ab" aside={<TileOpenButton label="Vorrat öffnen" onOpen={onOpen} />} className="col-span-2">
      {rows.length === 0 ? (
        <p className="text-sm text-(--d6-muted)">Alles hält bis zum Zieldatum. Schön!</p>
      ) : (
        <ul className="divide-y divide-(--d6-line)">
          {rows.map(({ key, entry, count }) => (
            <li key={key} className="flex items-center gap-3 py-2.5">
              <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-(--d6-glass-strong) text-lg">
                {getCategory(entry.product.category).emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {count} × {entry.product.name}
                </p>
                <p className={`${MONO} text-[11px] text-(--d6-subtle)`}>
                  {formatDate(entry.unit.mhd)} · {daysLeftLabel(entry.daysLeft)}
                </p>
              </div>
              <AmpelDot ampel={entry.ampel} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-(--d6-subtle)">
        {hidden > 0 && <span className="font-medium text-(--d6-muted)">+{hidden} weitere · </span>}
        MHD ist kein Wegwerfdatum: anschauen, riechen, probieren.
      </p>
    </GlassTile>
  );
}
