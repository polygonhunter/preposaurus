import { ShoppingBasket } from "lucide-react";
import type { RestockItem } from "@/lib/types";
import { INK_ICON, LABEL, MONO } from "../theme/styles";
import { GlassTile, TileOpenButton } from "../ui/GlassTile";
import { Ticker } from "../ui/Ticker";

const PREVIEW_ROWS = 3;

interface RestockTileProps {
  openItems: RestockItem[];
  onOpen: (tile: HTMLElement | null) => void;
}

/** Nachkaufen auf einen Blick: Zahl offener Posten plus die ersten Einträge. */
export function RestockTile({ openItems, onOpen }: RestockTileProps) {
  const rows = openItems.slice(0, PREVIEW_ROWS);
  const hidden = openItems.length - rows.length;

  return (
    <GlassTile
      flipId="tile-nachkaufen"
      label="Nachkaufen"
      aside={<TileOpenButton label="Nachkaufen öffnen" onOpen={onOpen} />}
      className="col-span-2"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0">
          <span className={INK_ICON}>
            <ShoppingBasket size={18} />
          </span>
          <p className="mt-2">
            <Ticker value={openItems.length} className="text-3xl font-light" />
            <span className={`${LABEL} block`}>offen</span>
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-(--d6-muted)">Alles erledigt – gerade fehlt nichts.</p>
        ) : (
          <ul className="min-w-0 flex-1 divide-y divide-(--d6-line)">
            {rows.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                <span className="truncate font-medium">{item.label}</span>
                <span className={`${MONO} shrink-0 text-xs text-(--d6-muted)`}>{item.amount}</span>
              </li>
            ))}
            {hidden > 0 && <li className="pt-2 text-[11px] text-(--d6-subtle)">+{hidden} weitere</li>}
          </ul>
        )}
      </div>
    </GlassTile>
  );
}
