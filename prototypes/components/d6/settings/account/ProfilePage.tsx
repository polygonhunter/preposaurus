"use client";

import { KeyRound, Lock } from "lucide-react";
import { endSession, patchUser } from "@/lib/user-rules";
import { BUTTON_SECONDARY, FIELD } from "../../theme/styles";
import { FormField } from "../../ui/Controls";
import { ROLE_LABELS } from "../labels";
import { useSettingsContext } from "../state/context";
import { FeedbackLine, useDemoFeedback } from "../ui/DemoFeedback";
import { SessionList } from "../ui/SessionList";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";

/** Mein Konto → Profil: Name, E-Mail, Passwort, Passkey, Geräte. */
export function ProfilePage() {
  const { settings } = useSettingsContext();
  const { currentUser: user, updateUsers } = settings;
  const feedback = useDemoFeedback();
  if (!user) return null;
  const patch = (changes: { name?: string; email?: string }) => updateUsers((users) => patchUser(users, user.id, changes));

  return (
    <SettingsPageFrame intro={`Gilt nur für dich. Rolle im Haushalt: ${ROLE_LABELS[user.role]}.`}>
      <div data-tile className="space-y-3">
        <FormField label="Name" htmlFor="d6-profile-name">
          <input id="d6-profile-name" className={FIELD} value={user.name} onChange={(e) => patch({ name: e.target.value })} />
        </FormField>
        <FormField label="E-Mail" htmlFor="d6-profile-mail">
          <input id="d6-profile-mail" type="email" className={FIELD} value={user.email} onChange={(e) => patch({ email: e.target.value })} />
        </FormField>
      </div>
      <SettingsGroup title="Anmeldung" note="Passwörter und Passkeys bleiben auf deinem eigenen Server.">
        <div className="flex flex-wrap gap-2 p-3">
          <button type="button" className={BUTTON_SECONDARY} onClick={() => feedback.show("Passwort ändern geöffnet (Demo)")}>
            <Lock aria-hidden className="size-4" /> Passwort ändern
          </button>
          <button type="button" className={BUTTON_SECONDARY} onClick={() => feedback.show("Passkey für dieses Gerät hinzugefügt (Demo)")}>
            <KeyRound aria-hidden className="size-4" /> Passkey hinzufügen
          </button>
        </div>
      </SettingsGroup>
      <FeedbackLine message={feedback.message} />
      <SessionList sessions={user.sessions} onEnd={(id) => updateUsers((users) => endSession(users, user.id, id))} />
    </SettingsPageFrame>
  );
}
