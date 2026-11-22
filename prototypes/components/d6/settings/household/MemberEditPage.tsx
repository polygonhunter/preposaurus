"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { MemberProfile } from "@/lib/settings-types";
import { BUTTON_SECONDARY } from "../../theme/styles";
import { useSettingsContext } from "../state/context";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { MemberBasicsFields } from "./MemberBasicsFields";
import { MemberDetailFields } from "./MemberDetailFields";

/** Haushalt → Mitglieder → Bearbeiten. Änderungen wirken sofort auf alle Berechnungen. */
export function MemberEditPage({ memberId }: { memberId: string }) {
  const { cockpit, nav } = useSettingsContext();
  const { members, householdDiet, updateMember, removeMember } = cockpit.diet;
  const [confirming, setConfirming] = useState(false);
  const member = members.find((m) => m.id === memberId);
  if (!member) return <p className="px-1 text-sm text-(--d6-muted)">Dieses Mitglied gibt es nicht mehr.</p>;

  const patch = (changes: Partial<MemberProfile>) => updateMember(member.id, changes);
  const remove = () => {
    removeMember(member.id);
    nav.back();
  };

  return (
    <SettingsPageFrame intro="Änderungen gelten sofort. Gesundheitsangaben bleiben auf deinem eigenen Server.">
      <MemberBasicsFields member={member} householdDiet={householdDiet} onPatch={patch} />
      <MemberDetailFields member={member} onPatch={patch} />
      <div data-tile className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={members.length <= 1}
          onClick={confirming ? remove : () => setConfirming(true)}
          className={BUTTON_SECONDARY}
        >
          <Trash2 aria-hidden className="size-4" /> {confirming ? `${member.name} wirklich entfernen` : "Mitglied entfernen"}
        </button>
        {confirming && (
          <button type="button" onClick={() => setConfirming(false)} className="px-3 text-sm text-(--d6-muted)">
            Abbrechen
          </button>
        )}
      </div>
    </SettingsPageFrame>
  );
}
