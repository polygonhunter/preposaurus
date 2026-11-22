"use client";

import { UserPlus } from "lucide-react";
import { needsB12Hint } from "@/lib/diet";
import { B12Hint } from "../../ui/B12Hint";
import { KIND_LABELS, memberDietText } from "../labels";
import { useSettingsContext } from "../state/context";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

/** Haushalt → Mitglieder: Liste, anlegen, zum Bearbeiten öffnen. */
export function MembersPage() {
  const { cockpit, nav } = useSettingsContext();
  const { members, householdDiet, addMember } = cockpit.diet;

  return (
    <SettingsPageFrame intro="Für diese Personen wird der Vorrat berechnet. Ein Login ist dafür nicht nötig.">
      <SettingsGroup title={`${members.length} Personen`} note="Haustiere kommen später als eigener Typ.">
        {members.map((m) => (
          <SettingsRow
            key={m.id}
            kind="nav"
            emoji={m.emoji}
            label={m.name}
            detail={`${KIND_LABELS[m.kind]} · ${memberDietText(m, householdDiet)}`}
            onClick={() => nav.push({ page: "mitglied", param: m.id })}
          />
        ))}
        <SettingsRow kind="nav" icon={UserPlus} label="Mitglied hinzufügen" onClick={() => nav.push({ page: "mitglied", param: addMember() })} />
      </SettingsGroup>
      {needsB12Hint(members, householdDiet) && <B12Hint />}
    </SettingsPageFrame>
  );
}
