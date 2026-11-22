"use client";

import { UserPlus } from "lucide-react";
import type { AppUser } from "@/lib/settings-types";
import type { Member } from "@/lib/types";
import { KIND_LABELS, ROLE_LABELS } from "../labels";
import { useSettingsContext } from "../state/context";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

function userDetail(user: AppUser, members: Member[]): string {
  const member = members.find((m) => m.id === user.memberId);
  const status = !user.active ? "deaktiviert" : user.invited ? "eingeladen" : null;
  return [ROLE_LABELS[user.role], member ? `↔ ${member.name}` : "ohne Mitglied", status].filter(Boolean).join(" · ");
}

/** Nutzerverwaltung: Login-Nutzer (≠ Haushaltsmitglieder) und Mitglieder ohne Login. */
export function UsersPage() {
  const { settings, cockpit, nav } = useSettingsContext();
  const { users } = settings;
  const { members } = cockpit.diet;
  const withoutLogin = members.filter((m) => !users.some((u) => u.memberId === m.id));

  return (
    <SettingsPageFrame intro="Nutzer melden sich an. Mitglieder sind die Personen, für die gerechnet wird. Beides lässt sich verknüpfen.">
      <SettingsGroup title={`Nutzer · ${users.length}`} note="Es bleibt immer mindestens ein Admin.">
        {users.map((u) => {
          const member = members.find((m) => m.id === u.memberId);
          return (
            <SettingsRow
              key={u.id}
              kind="nav"
              emoji={member?.emoji ?? "👤"}
              label={u.name}
              detail={userDetail(u, members)}
              onClick={() => nav.push({ page: "nutzer-detail", param: u.id })}
            />
          );
        })}
        <SettingsRow kind="nav" icon={UserPlus} label="Nutzer einladen" onClick={() => nav.push({ page: "einladen" })} />
      </SettingsGroup>
      {withoutLogin.length > 0 && (
        <SettingsGroup title="Mitglieder ohne Login" note="Ganz normal, z. B. bei Kindern. Sie zählen trotzdem voll mit.">
          {withoutLogin.map((m) => (
            <SettingsRow key={m.id} kind="value" emoji={m.emoji} label={m.name} detail={KIND_LABELS[m.kind]} value="kein Login" />
          ))}
        </SettingsGroup>
      )}
    </SettingsPageFrame>
  );
}
