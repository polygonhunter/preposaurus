"use client";

import type { CheckInMailFrequency, Weekday } from "@/lib/settings-types";
import { setSessionPush } from "@/lib/user-rules";
import { FIELD, MONO, cx } from "../../theme/styles";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { CHECK_IN_LABELS, WEEKDAY_LABELS, optionsFrom } from "../labels";
import { useSettingsContext } from "../state/context";
import { Select } from "../ui/Select";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { SettingsRow } from "../ui/SettingsRow";

const WEEKDAYS = optionsFrom<Weekday>(WEEKDAY_LABELS);
const CHECK_IN_OPTIONS = optionsFrom<CheckInMailFrequency>(CHECK_IN_LABELS);

/** Mein Konto → Benachrichtigungen: gebündelt statt einzeln, jede Person stellt selbst ein. */
export function NotificationsPage() {
  const { settings } = useSettingsContext();
  const { currentUser: user, notifications: n, patchNotifications: patch } = settings;
  if (!user) return null;

  return (
    <SettingsPageFrame intro="Gebündelt statt einzeln: keine Nachricht pro Packung.">
      <SettingsGroup title="Push je Gerät" note="Auf dem iPhone braucht Push die App auf dem Home-Bildschirm.">
        {user.sessions.map((s) => (
          <SettingsRow
            key={s.id}
            kind="toggle"
            label={s.device}
            detail={s.current ? "dieses Gerät" : undefined}
            checked={s.push}
            onChange={(push) => settings.updateUsers((users) => setSessionPush(users, user.id, s.id, push))}
          />
        ))}
      </SettingsGroup>
      <SettingsGroup title="Wochenübersicht">
        <SettingsRow kind="toggle" label="Wochenübersicht" detail="Bald fällig, Ziel-Stand, Einkauf" checked={n.weeklyDigest} onChange={(weeklyDigest) => patch({ weeklyDigest })} />
        <SettingsRow kind="value" label="Wann">
          <div className="flex gap-2">
            <Select label="Wochentag" value={n.digestDay} options={WEEKDAYS} disabled={!n.weeklyDigest} onChange={(digestDay) => patch({ digestDay })} />
            <input
              type="time"
              aria-label="Uhrzeit"
              value={n.digestTime}
              disabled={!n.weeklyDigest}
              onChange={(e) => patch({ digestTime: e.target.value })}
              className={cx(FIELD, MONO, "w-auto rounded-full py-1.5 text-sm disabled:opacity-50")}
            />
          </div>
        </SettingsRow>
      </SettingsGroup>
      <SettingsGroup title="Hinweise">
        <SettingsRow kind="toggle" label="Dringend" detail="z. B. „Thunfisch läuft in 7 Tagen ab“, höchstens 1× am Tag" checked={n.urgent} onChange={(urgent) => patch({ urgent })} />
        <SettingsRow kind="toggle" label="Etappen" detail="Ziel erreicht oder 2 Wochen vor dem Zieldatum" checked={n.milestones} onChange={(milestones) => patch({ milestones })} />
      </SettingsGroup>
      <SettingsGroup title="Check-in-Mail" note={`Geht an ${user.email}.`}>
        <div className="p-3">
          <SegmentedControl label="Check-in-Mail" value={n.checkInMail} options={CHECK_IN_OPTIONS} onChange={(checkInMail) => patch({ checkInMail })} className="w-full" />
        </div>
      </SettingsGroup>
    </SettingsPageFrame>
  );
}
