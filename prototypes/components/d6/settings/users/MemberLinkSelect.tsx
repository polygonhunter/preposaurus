"use client";

import { useSettingsContext } from "../state/context";
import { Select } from "../ui/Select";

const NO_MEMBER = "keins";

interface MemberLinkSelectProps {
  /** `null` = Nutzer wird gerade erst eingeladen */
  userId: string | null;
  value: string | null;
  onChange: (memberId: string | null) => void;
}

/** Auswahl des verknüpften Haushaltsmitglieds; vergebene Mitglieder werden markiert. */
export function MemberLinkSelect({ userId, value, onChange }: MemberLinkSelectProps) {
  const { cockpit, settings } = useSettingsContext();
  const owner = (memberId: string) => settings.users.find((u) => u.memberId === memberId && u.id !== userId);
  const options = [
    { key: NO_MEMBER, label: "kein Mitglied" },
    ...cockpit.diet.members.map((m) => {
      const taken = owner(m.id);
      return { key: m.id, label: taken ? `${m.emoji} ${m.name} (bei ${taken.name})` : `${m.emoji} ${m.name}` };
    }),
  ];

  return (
    <Select<string>
      label="Verknüpftes Mitglied"
      value={value ?? NO_MEMBER}
      options={options}
      onChange={(key) => onChange(key === NO_MEMBER ? null : key)}
    />
  );
}
