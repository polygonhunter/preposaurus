import { MACRO_KEYS, MACRO_LABELS, macroEnergyShares, targetEnergyShares } from "@/lib/nutrition";
import { formatAmount } from "@/lib/supply";
import type { Macros, Member } from "@/lib/types";
import type { LiveSupply } from "../data/use-cockpit";
import { BADGE, LABEL, MACRO_COLOR, MONO } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";

const percent = (share: number) => `${Math.round(share * 100)} %`;

/** Gestapelter Balken nach Energieanteil; Lücken zwischen den Segmenten trennen die Farben. */
function StackedBar({ shares, label, thin = false }: { shares: Macros; label: string; thin?: boolean }) {
  return (
    <div role="img" aria-label={`${label}: ${MACRO_KEYS.map((k) => `${MACRO_LABELS[k].label} ${percent(shares[k])}`).join(", ")}`} className="flex gap-0.5">
      {MACRO_KEYS.map((key) => (
        <span
          key={key}
          data-bar
          className={thin ? "h-1.5 rounded-full opacity-50" : "h-3 rounded-full"}
          style={{ width: `${shares[key] * 100}%`, background: MACRO_COLOR[key] }}
        />
      ))}
    </div>
  );
}

interface MacroShareTileProps {
  live: LiveSupply;
  members: Member[];
}

/** Makro-Verteilung des Vorrats (Energieanteil) im Vergleich zur angenommenen Bedarfs-Verteilung. */
export function MacroShareTile({ live, members }: MacroShareTileProps) {
  const { grams, partlyEstimated } = live.macroStock;
  const shares = macroEnergyShares(grams);
  const target = targetEnergyShares(members);

  return (
    <GlassTile label="Makro-Verteilung" aside={partlyEstimated && <span className={BADGE}>teils geschätzt</span>} className="col-span-2">
      <p className={`${LABEL} mb-1.5`}>Vorrat · Energieanteil</p>
      <StackedBar shares={shares} label="Vorrat" />
      <p className={`${LABEL} mb-1.5 mt-3`}>Bedarf (Prototyp-Annahme)</p>
      <StackedBar shares={target} label="Bedarf" thin />
      <ul className="mt-4 grid grid-cols-3 gap-2 text-xs">
        {MACRO_KEYS.map((key) => (
          <li key={key} className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-medium">
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: MACRO_COLOR[key] }} />
              {MACRO_LABELS[key].label}
            </p>
            <p className={`${MONO} mt-0.5 text-(--d6-muted)`}>
              {percent(shares[key])} <span className="text-(--d6-subtle)">/ {percent(target[key])}</span>
            </p>
            <p className={`${MONO} text-[11px] text-(--d6-subtle)`}>{formatAmount(Math.round(grams[key]), "g")}</p>
          </li>
        ))}
      </ul>
    </GlassTile>
  );
}
