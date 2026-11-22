"use client";

import { useState } from "react";
import type { CategoryProgress } from "@/lib/supply";
import { SegmentedToggle } from "../ui/SegmentedToggle";
import { JarTile } from "./JarTile";

interface CategoryJarsProps {
  today: CategoryProgress[];
  atGoal: CategoryProgress[];
  goalLabel: string;
}

type View = "today" | "goal";

/** Regal mit Gläsern je Warengruppe, umschaltbar zwischen heute und Zieldatum. */
export function CategoryJars({ today, atGoal, goalLabel }: CategoryJarsProps) {
  const [view, setView] = useState<View>("today");
  const progress = view === "today" ? today : atGoal;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3" data-pop>
        <h2 className="font-[family-name:var(--font-d5-display)] text-2xl font-extrabold">Deine Gläser</h2>
        <div className="w-44">
          <SegmentedToggle
            label="Stichtag"
            value={view}
            onChange={setView}
            options={[
              { value: "today", label: "Heute" },
              { value: "goal", label: goalLabel },
            ]}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 min-[400px]:grid-cols-3">
        {progress.map((p) => (
          <JarTile key={p.key} progress={p} />
        ))}
      </div>
      <p className="text-center text-xs font-bold text-(--d5-muted)">
        Strich = 100 % Empfehlung · gestreift = mehr als genug
      </p>
    </section>
  );
}
