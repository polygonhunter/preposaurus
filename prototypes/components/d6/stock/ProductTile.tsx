"use client";

import { useRef, type MouseEvent } from "react";
import { Info, MapPin, PackageMinus } from "lucide-react";
import { CONTAINER_LABELS, getCategory } from "@/lib/categories";
import type { ResolvedMacros } from "@/lib/nutrition";
import type { Ampel } from "@/lib/types";
import { formatDate } from "@/lib/supply";
import { sortByMhd } from "@/lib/unit-history";
import { quantityLabel } from "../data/format";
import type { StockProduct } from "../data/stock";
import { gsap, useGSAP } from "../motion/gsap";
import { flashGlow, popFeedback, prefersReducedMotion } from "../motion/motion";
import { AMPEL, BADGE, MONO, cx } from "../theme/styles";
import { AmpelDot } from "../ui/Controls";
import { GlassTile } from "../ui/GlassTile";
import { MacroLine } from "../ui/MacroLine";
import { UnitDisclosure, type UnitActions } from "./UnitList";

interface ProductTileProps {
  product: StockProduct;
  /** Ampel je MHD nach den Schwellen aus den Einstellungen */
  ampelOf: (mhd: string) => Ampel;
  unitActions: UnitActions;
  macros: ResolvedMacros;
  /** z. B. „zählt nicht für Kim (vegetarisch)“ */
  dietNote: string | null;
  /** Einheiten-Liste gleich aufgeklappt (Status-Ansichten) */
  unitsOpen?: boolean;
}

/** Produkt-Kachel: Emoji, „6 × 500 g“, Ampel je Einheit (MHD), Makros, Einheiten mit Aktionen. */
export function ProductTile({ product, ampelOf, unitActions, macros, dietNote, unitsOpen = false }: ProductTileProps) {
  const scope = useRef<HTMLDivElement>(null);
  const units = sortByMhd(product.units);
  const mhd = units[0]?.mhd;
  const { contextSafe } = useGSAP({ scope });

  const take = contextSafe((event: MouseEvent<HTMLButtonElement>) => {
    const tile = event.currentTarget.closest("[data-tile]");
    if (!units[0]) return;
    unitActions.onResolve(units[0].id, "verbraucht");
    popFeedback(tile?.querySelector("[data-quantity]") ?? null);
    flashGlow(tile?.querySelector("[data-glow]"));
    if (prefersReducedMotion()) return;
    gsap.fromTo("[data-minus]", { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -26, duration: 0.9, ease: "power2.out" });
  });

  return (
    <GlassTile flipId={product.id} className="flex flex-col">
      <div ref={scope} className="flex flex-1 flex-col">
        <span
          data-glow
          aria-hidden
          className="pointer-events-none invisible absolute inset-0 rounded-[28px] border border-(--d6-accent) shadow-[0_0_28px_-4px_var(--d6-glow)]"
        />
        <div className="flex items-start gap-3">
          <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-(--d6-glass-strong) text-2xl shadow-sm">
            {getCategory(product.category).emoji}
          </span>
          <div className="relative min-w-0">
            <h3 className="truncate text-[15px] font-semibold leading-tight">{product.name}</h3>
            <p data-quantity className={`${MONO} mt-0.5 origin-left whitespace-nowrap text-[13px] text-(--d6-muted)`}>
              {quantityLabel(product.units.length, product)}
            </p>
            <span data-minus aria-hidden className={`${MONO} invisible absolute right-0 top-0 text-sm font-semibold text-(--d6-accent-text)`}>
              −1
            </span>
          </div>
        </div>

        <div className="mt-3 flex-1 space-y-1.5 text-xs">
          {mhd ? (
            <>
              <AmpelDot ampel={ampelOf(mhd)} withLabel />
              <p className={`${MONO} text-(--d6-subtle)`}>ab {formatDate(mhd)}</p>
            </>
          ) : (
            <p className="text-(--d6-muted)">Aufgebraucht – Zeit zum Nachkaufen.</p>
          )}
          <ul className="flex flex-wrap gap-1" aria-label="MHD je Einheit">
            {units.map((unit) => (
              <li key={unit.id} title={formatDate(unit.mhd)} className="h-3 w-1.5 rounded-sm" style={{ background: AMPEL[ampelOf(unit.mhd)].fill }} />
            ))}
          </ul>
          <p className="flex flex-wrap items-center gap-1 text-(--d6-subtle)">
            {CONTAINER_LABELS[product.container]} · <MapPin className="size-3" /> {product.location}
            {product.kcalEstimated && <span className={cx(BADGE, "ml-1")}>kcal geschätzt</span>}
          </p>
          <MacroLine macros={macros} unit={product.unit} />
          {dietNote && (
            <p className="flex items-start gap-1 text-[11px] leading-snug text-(--d6-muted)">
              <Info aria-hidden className="mt-px size-3 shrink-0 text-(--d6-subtle)" /> {dietNote}
            </p>
          )}
        </div>

        {product.units.length > 0 && <UnitDisclosure key={String(unitsOpen)} units={units} ampelOf={ampelOf} initiallyOpen={unitsOpen} {...unitActions} />}

        <button
          type="button"
          disabled={product.units.length === 0}
          onClick={take}
          title="Die Einheit mit dem frühesten MHD gilt als verbraucht"
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-(--d6-line) bg-(--d6-glass-strong) py-2 text-[13px] font-medium transition hover:border-(--d6-accent) hover:text-(--d6-accent-text) active:scale-[0.97] disabled:opacity-40"
        >
          <PackageMinus className="size-3.5" /> 1 entnehmen
        </button>
      </div>
    </GlassTile>
  );
}
