import type { MacroDays, MacroKey } from "@/lib/nutrition";
import { formatAmount } from "@/lib/supply";
import type { LiveSupply } from "../data/use-cockpit";
import { BADGE, MACRO_COLOR, MONO, cx, readoutSurface } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";
import { Ticker } from "../ui/Ticker";

/** Weiches Trennzeichen, damit „Kohlenhydrate“ in schmalen Instrumenten sauber umbricht. */
const METER_LABELS: Record<MacroKey, string> = { protein: "Eiweiß", carbs: "Kohlen\u00ADhydrate", fat: "Fett" };

/** Kleines Instrument je Makro: Tage, Balken gegen das Ziel, Bestand in g. */
function MacroMeter({ row, goalDays }: { row: MacroDays; goalDays: number }) {
  const color = MACRO_COLOR[row.key];
  return (
    <li
      className={cx(
        "min-w-0 rounded-2xl border px-3 py-2.5",
        readoutSurface(row.limiting),
      )}
    >
      <p className="flex min-h-[2.5em] items-start gap-1.5 text-xs font-medium leading-tight text-(--d6-muted)">
        <span aria-hidden className="mt-1 size-1.5 shrink-0 rounded-full" style={{ background: color }} />
        <span className="min-w-0 hyphens-manual">{METER_LABELS[row.key]}</span>
      </p>
      <p className="mt-1 whitespace-nowrap">
        <Ticker value={row.days} digits={1} className="text-2xl font-light" /> <span className="text-xs text-(--d6-muted)">Tage</span>
      </p>
      <div className="mt-1.5 h-1.5 rounded-full bg-(--d6-track)">
        <div
          data-bar
          className="h-full rounded-full transition-[width] duration-700"
          style={{ width: `${Math.min(row.days / goalDays, 1) * 100}%`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
      <p className={cx(MONO, "mt-1.5 truncate text-[11px] text-(--d6-subtle)")}>{formatAmount(Math.round(row.stockGrams), "g")}</p>
      <p className={cx("text-[11px] font-medium", row.limiting ? "text-(--d6-accent-text)" : "text-(--d6-subtle)")}>
        {row.limiting ? "Engpass" : "reicht länger"}
      </p>
    </li>
  );
}

interface MacroTileProps {
  live: LiveSupply;
  goalDays: number;
}

/** Eiweiß, Kohlenhydrate, Fett: wie viele Tage der heutige Vorrat den Haushalt versorgt. */
export function MacroTile({ live, goalDays }: MacroTileProps) {
  return (
    <GlassTile
      label="Makronährstoffe"
      aside={live.macroStock.partlyEstimated && <span className={BADGE}>teils geschätzt</span>}
      className="col-span-2"
    >
      <ul className="grid grid-cols-3 gap-2">
        {live.macros.map((row) => (
          <MacroMeter key={row.key} row={row} goalDays={goalDays} />
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-(--d6-subtle)">
        Bedarf mit Prototyp-Werten (Eiweiß nach Referenzgewicht, Fett 30 %, Kohlenhydrate 50 % der Energie). Fehlende Angaben: Ø der Warengruppe.
      </p>
    </GlassTile>
  );
}
