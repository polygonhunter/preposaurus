"use client";

import { useState } from "react";
import { CategoryBar } from "./CategoryBar";
import { GlassTile, TileOpenButton } from "./GlassTile";
import { SegmentedControl } from "./SegmentedControl";
import { formatDayMonth } from "./stock";
import { LABEL } from "./styles";
import type { LiveSupply } from "./use-live-supply";

type Horizon = "heute" | "ziel";

interface CategoryTileProps {
  live: LiveSupply;
  targetDate: string;
  onOpen: (tile: HTMLElement | null) => void;
}

/** Erfüllungsgrad je Warengruppe, umschaltbar zwischen heute und Zieldatum. */
export function CategoryTile({ live, targetDate, onOpen }: CategoryTileProps) {
  const [horizon, setHorizon] = useState<Horizon>("ziel");
  const progress = horizon === "heute" ? live.progressToday : live.progressGoal;

  return (
    <GlassTile flipId="tile-vorrat" className="col-span-2 p-5 md:row-span-2">
      <div className="flex items-center justify-between gap-2">
        <span className={LABEL}>Warengruppen</span>
        <div className="flex items-center gap-2">
          <SegmentedControl
            size="sm"
            flipId="d3-horizon-pill"
            value={horizon}
            onChange={setHorizon}
            options={[
              { key: "heute", label: "Heute" },
              { key: "ziel", label: formatDayMonth(targetDate) },
            ]}
          />
          <TileOpenButton label="Vorrat öffnen" onOpen={onOpen} />
        </div>
      </div>
      <div className="mt-4 space-y-3.5">
        {progress.map((p) => (
          <CategoryBar key={p.key} progress={p} />
        ))}
      </div>
      <p className="mt-4 text-[11px] text-slate-500">Strich = Empfehlung (100 %). Grün darüber: mehr als nötig.</p>
    </GlassTile>
  );
}
