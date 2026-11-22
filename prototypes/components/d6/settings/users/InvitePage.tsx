"use client";

import { useState, type FormEvent } from "react";
import { Copy, Link2 } from "lucide-react";
import type { Role } from "@/lib/settings-types";
import { inviteUser, type InviteDraft } from "@/lib/user-rules";
import { BUTTON_PRIMARY, BUTTON_SECONDARY, FIELD, MONO, cx } from "../../theme/styles";
import { FormField } from "../../ui/Controls";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { ROLE_LABELS, optionsFrom } from "../labels";
import { useSettingsContext } from "../state/context";
import { FeedbackLine, useDemoFeedback } from "../ui/DemoFeedback";
import { SettingsPageFrame } from "../ui/SettingsPageFrame";
import { MemberLinkSelect } from "./MemberLinkSelect";

const ROLE_OPTIONS = optionsFrom<Role>(ROLE_LABELS);
const EMPTY_DRAFT: InviteDraft = { name: "", email: "", role: "mitglied", memberId: null };
const INVITE_BASE_URL = "http://localhost:3000/einladung/";

/** Nutzerverwaltung → Einladen: erzeugt einen (Demo-)Einladungslink, kein E-Mail-Zwang. */
export function InvitePage() {
  const { settings } = useSettingsContext();
  const [draft, setDraft] = useState<InviteDraft>(EMPTY_DRAFT);
  const [link, setLink] = useState<string | null>(null);
  const feedback = useDemoFeedback();
  const patch = (changes: Partial<InviteDraft>) => setDraft((prev) => ({ ...prev, ...changes }));
  const isValid = draft.name.trim().length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    const id = `u${settings.users.length + 1}-${Date.now().toString(36)}`;
    settings.updateUsers((users) => inviteUser(users, { ...draft, name: draft.name.trim() }, id));
    setLink(`${INVITE_BASE_URL}${id}`);
    setDraft(EMPTY_DRAFT);
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      feedback.show("Link kopiert");
    } catch {
      feedback.show("Kopieren ging nicht. Bitte den Link markieren.");
    }
  };

  return (
    <SettingsPageFrame intro="Der Link gilt 7 Tage. Wer ihn öffnet, legt selbst ein Passwort oder einen Passkey an.">
      <form data-tile onSubmit={submit} className="space-y-4">
        <FormField label="Name" htmlFor="d6-invite-name">
          <input id="d6-invite-name" className={FIELD} value={draft.name} placeholder="z. B. Oma Rosi" onChange={(e) => patch({ name: e.target.value })} />
        </FormField>
        <FormField label="E-Mail (optional)" htmlFor="d6-invite-mail">
          <input id="d6-invite-mail" type="email" className={FIELD} value={draft.email} onChange={(e) => patch({ email: e.target.value })} />
        </FormField>
        <FormField label="Rolle">
          <SegmentedControl label="Rolle" value={draft.role} options={ROLE_OPTIONS} onChange={(role) => patch({ role })} className="w-full" />
        </FormField>
        <FormField label="Haushaltsmitglied">
          <MemberLinkSelect userId={null} value={draft.memberId} onChange={(memberId) => patch({ memberId })} />
        </FormField>
        <button type="submit" disabled={!isValid} className={cx(BUTTON_PRIMARY, "w-full")}>
          <Link2 aria-hidden className="size-4" /> Einladungslink erzeugen
        </button>
      </form>
      {link && (
        <div data-tile className="space-y-2 rounded-[24px] border border-(--d6-accent)/40 bg-(--d6-accent-soft) p-3">
          <p className="text-sm font-medium text-(--d6-accent-text)">Einladung angelegt (Demo)</p>
          <input readOnly aria-label="Einladungslink" value={link} className={cx(FIELD, MONO, "text-xs")} onFocus={(e) => e.target.select()} />
          <button type="button" onClick={copy} className={BUTTON_SECONDARY}>
            <Copy aria-hidden className="size-4" /> Link kopieren
          </button>
        </div>
      )}
      <FeedbackLine message={feedback.message} />
    </SettingsPageFrame>
  );
}
