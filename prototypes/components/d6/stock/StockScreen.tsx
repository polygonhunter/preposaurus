"use client";

import { useState } from "react";
import { DIET_LABELS, dietConflicts, needsB12Hint } from "@/lib/diet";
import { resolveMacros } from "@/lib/nutrition";
import type { Product } from "@/lib/types";
import { isHistoryView, productsForView, viewCounts } from "../data/stock-status";
import type { Cockpit } from "../data/use-cockpit";
import { gsap } from "../motion/gsap";
import { useFlipLayout } from "../motion/hooks";
import { LABEL } from "../theme/styles";
import { B12Hint } from "../ui/B12Hint";
import { Ticker } from "../ui/Ticker";
import { HistoryList } from "./HistoryList";
import { ProductTile } from "./ProductTile";
import { StockFilters, applyStockFilter, type StockFilter } from "./StockFilters";

interface StockScreenProps {
  cockpit: Cockpit;
  today: string;
}

/** Vorrat: Status-, Gruppen- und Behälterfilter sortieren das Kachel-Raster per Flip um (Design 3). */
export function StockScreen({ cockpit, today }: StockScreenProps) {
  const { stock, diet, restock } = cockpit;
  const [filter, setFilter] = useState<StockFilter>({ view: "vorrat", category: null, container: null });
  const context = { today, restock, rules: cockpit.rules.ampel };
  const visible = applyStockFilter(productsForView(stock.products, filter.view, context), filter);
  const history = applyStockFilter(stock.history.filter((h) => h.outcome === filter.view), filter);
  const unitCount = visible.reduce((sum, p) => sum + p.units.length, 0);
  const { scope, capture } = useFlipLayout<HTMLDivElement>("[data-tile]", [filter], {
    absolute: true,
    onEnter: (entering) =>
      gsap.fromTo(
        entering,
        { autoAlpha: 0, scale: 0.85, filter: "blur(10px)" },
        { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.5, delay: 0.2, clearProps: "filter" },
      ),
  });

  const dietNote = (product: Product) => {
    const conflicts = dietConflicts(product, diet.members, diet.householdDiet);
    if (conflicts.length === 0) return null;
    return `zählt nicht für ${conflicts.map(({ member, diet: d }) => `${member.name} (${DIET_LABELS[d]})`).join(", ")}`;
  };

  return (
    <div className="space-y-4">
      <StockFilters
        products={stock.products}
        filter={filter}
        counts={viewCounts(stock.products, stock.history, context)}
        onChange={(next) => {
          capture();
          setFilter(next);
        }}
      />
      {needsB12Hint(diet.members, diet.householdDiet) && <B12Hint />}
      {isHistoryView(filter.view) ? (
        <HistoryList outcome={filter.view} entries={history} />
      ) : (
        <>
          <div data-tile className="flex items-baseline justify-between px-1">
            <p className={LABEL}>{visible.length} Produkte</p>
            <p className="whitespace-nowrap text-sm text-(--d6-muted)">
              <Ticker value={unitCount} className="font-medium text-(--d6-text)" /> Einheiten
            </p>
          </div>
          <div ref={scope} className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {visible.map((product) => (
              <ProductTile
                key={product.id}
                product={product}
                ampelOf={cockpit.ampelOf}
                macros={resolveMacros(product, stock.products)}
                dietNote={dietNote(product)}
                unitsOpen={filter.view === "bald" || filter.view === "abgelaufen"}
                unitActions={{
                  checks: stock.checks,
                  onResolve: (unitId, outcome) => stock.resolve(product.id, unitId, outcome),
                  onCheck: stock.markChecked,
                }}
              />
            ))}
          </div>
          {visible.length === 0 && (
            <p className="rounded-3xl bg-(--d6-glass) p-6 text-center text-sm text-(--d6-muted)">Für diese Auswahl ist nichts im Vorrat.</p>
          )}
          {filter.view === "abgelaufen" && visible.length > 0 && (
            <p className="px-2 text-center text-xs text-(--d6-subtle)">
              MHD ist kein Wegwerfdatum. Was nach Prüfung „noch gut“ ist, bleibt im Vorrat, zählt aber vorsichtshalber nicht zu „versorgt“.
            </p>
          )}
        </>
      )}
    </div>
  );
}
