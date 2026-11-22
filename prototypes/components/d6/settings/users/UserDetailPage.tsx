"use client";

import { useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import type { Role } from "@/lib/settings-types";
import { changeRole, endSession, findUser, isLastAdmin, linkMember, removeUser, setUserActive } from "@/lib/user-rules";
import { BUTTON_SECONDARY } from "../../theme/styles";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { ROLE_LABELS, formatDateTime, optionsFrom } from "../labels";
import { useSettingsContext } from "../state/context";
import { FeedbackLine, useDemoFeedback } from "../ui/DemoFeedback";
import { SessionList } from "../ui/SessionList";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";
import { MemberLinkSelect } from "./MemberLinkSelect";

const ROLE_OPTIONS = optionsFrom<Role>(ROLE_LABELS);

/** Nutzerverwaltung → Nutzer: Rolle, Verknüpfung, Zugang, Sitzungen. Der letzte Admin ist geschützt. */
export function UserDetailPage({ userId }: { userId: string }) {
  const { settings, nav } = useSettingsContext();
  const { users, updateUsers, currentUser } = settings;
  const feedback = useDemoFeedback();
  const [confirming, setConfirming] = useState(false);
  const user = findUser(users, userId);
  if (!user) return <p className="px-1 text-sm text-(--d6-muted)">Diesen Nutzer gibt es nicht mehr.</p>;

  const lastAdmin = isLastAdmin(users, user.id);
  const isSelf = user.id === currentUser?.id;
  const remove = () => {
    updateUsers((list) => removeUser(list, user.id));
    nav.back();
  };

  return (
    <SettingsPageFrame intro={`${user.email}${user.invited ? " · Einladung offen" : ""}`}>
      <SettingsGroup title="Rolle" note={lastAdmin ? `${user.name} ist der letzte Admin und kann nicht herabgestuft werden.` : "Admins ändern Haushalt, Nutzer und System."}>
        <fieldset disabled={lastAdmin} className="p-3 disabled:opacity-60">
          <SegmentedControl label="Rolle" value={user.role} options={ROLE_OPTIONS} onChange={(role) => updateUsers((list) => changeRole(list, user.id, role))} className="w-full" />
        </fieldset>
      </SettingsGroup>
      <SettingsGroup title="Haushaltsmitglied" note="Optional. Ein Mitglied gehört höchstens zu einem Nutzer.">
        <SettingsRow kind="value" label="Verknüpft mit">
          <MemberLinkSelect
            userId={user.id}
            value={user.memberId}
            onChange={(memberId) => updateUsers((list) => linkMember(list, user.id, memberId))}
          />
        </SettingsRow>
      </SettingsGroup>
      <SettingsGroup title="Zugang">
        <SettingsRow
          kind="toggle"
          label="Aktiv"
          detail={lastAdmin ? "Der letzte Admin bleibt aktiv." : "Deaktiviert = keine Anmeldung, Sitzungen enden."}
          checked={user.active}
          disabled={lastAdmin}
          onChange={(active) => updateUsers((list) => setUserActive(list, user.id, active))}
        />
        <SettingsRow kind="value" label="Letzter Login" value={user.lastLogin ? formatDateTime(user.lastLogin) : "noch nie"} />
        <div className="flex flex-wrap gap-2 p-3">
          <button type="button" className={BUTTON_SECONDARY} onClick={() => feedback.show(`Einmal-Link zum Zurücksetzen für ${user.name} erzeugt (Demo)`)}>
            <KeyRound aria-hidden className="size-4" /> Passwort zurücksetzen
          </button>
          <button type="button" disabled={lastAdmin || isSelf} className={BUTTON_SECONDARY} onClick={confirming ? remove : () => setConfirming(true)}>
            <Trash2 aria-hidden className="size-4" /> {confirming ? "Wirklich entfernen" : "Nutzer entfernen"}
          </button>
        </div>
      </SettingsGroup>
      <FeedbackLine message={feedback.message} />
      <SessionList sessions={user.sessions} onEnd={(id) => updateUsers((list) => endSession(list, user.id, id))} />
    </SettingsPageFrame>
  );
}
