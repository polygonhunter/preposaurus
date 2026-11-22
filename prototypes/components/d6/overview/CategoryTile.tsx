"use client";

import { useState } from "react";
import { formatDayMonth } from "../data/format";
import type { LiveSupply } from "../data/use-cockpit";
import { GlassTile, TileOpenButton } from "../ui/GlassTile";
import { LevelBar } from "../ui/LevelBar";
import { SegmentedControl } from "../ui/SegmentedControl";

type Horizon = "heute" | "ziel";

interface CategoryTileProps {
  live: LiveSupply;
  goalDays: number;
  targetDate: string;
  onOpen: (tile: HTMLElement | null) => void;
}

/** Erfüllungsgrad je Warengruppe, umschaltbar zwischen heute und Zieldatum. */
export function CategoryTile({ live, goalDays, targetDate, onOpen }: CategoryTileProps) {
  const [horizon, setHorizon] = useState<Horizon>("ziel");
  const progress = horizon === "heute" ? live.progressToday : live.progressGoal;

  return (
    <GlassTile
      flipId="tile-vorrat"
      label="Warengruppen"
      aside={
        <div className="flex items-center gap-2">
          <SegmentedControl
            size="sm"
            label="Stichtag"
            value={horizon}
            onChange={setHorizon}
            options={[
              { key: "heute", label: "Heute" },
              { key: "ziel", label: formatDayMonth(targetDate) },
            ]}
          />
          <TileOpenButton label="Vorrat öffnen" onOpen={onOpen} />
        </div>
      }
      padding="p-5"
      className="col-span-2 md:row-span-2"
    >
      <ul className="space-y-3.5">
        {progress.map((p) => (
          <LevelBar key={p.key} progress={p} />
        ))}
      </ul>
      <p className="mt-4 text-[11px] leading-relaxed text-(--d6-subtle)">
        Strich = BLE-Empfehlung für {goalDays} Tage (100 %), angepasst an die Ernährungsform. Grün darüber: mehr als nötig.
      </p>
    </GlassTile>
  );
}
