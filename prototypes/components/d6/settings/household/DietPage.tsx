"use client";

import { DIETS, needsB12Hint } from "@/lib/diet";
import { B12Hint } from "../../ui/B12Hint";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { dietLabel, memberDietText } from "../labels";
import { useSettingsContext } from "../state/context";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

const DIET_OPTIONS = DIETS.map((key) => ({ key, label: dietLabel(key) }));

/** Haushalt → Ernährung: Standard für alle, die keine eigene Angabe haben. */
export function DietPage() {
  const { cockpit, nav } = useSettingsContext();
  const { members, householdDiet, setHouseholdDiet } = cockpit.diet;

  return (
    <SettingsPageFrame intro="Die Ernährungsform verschiebt Mengen zwischen Warengruppen. Die Kalorien bleiben gleich.">
      <SettingsGroup title="Haushalts-Standard">
        <div className="p-3">
          <SegmentedControl label="Ernährungsform im Haushalt" value={householdDiet} onChange={setHouseholdDiet} options={DIET_OPTIONS} className="w-full" />
        </div>
      </SettingsGroup>
      <SettingsGroup title="Je Mitglied" note="Eigene Angaben änderst du beim Mitglied.">
        {members.map((m) => (
          <SettingsRow
            key={m.id}
            kind="nav"
            emoji={m.emoji}
            label={m.name}
            value={memberDietText(m, householdDiet)}
            onClick={() => nav.push({ page: "mitglied", param: m.id })}
          />
        ))}
      </SettingsGroup>
      {needsB12Hint(members, householdDiet) && <B12Hint />}
      <p data-tile className="px-1 text-[11px] leading-relaxed text-(--d6-subtle)">
        Prototyp-Annahme: Was eine Ernährungsform weglässt, wird mengengleich auf Hülsenfrüchte sowie Obst & Nüsse verteilt.
      </p>
    </SettingsPageFrame>
  );
}
