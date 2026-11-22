import { DIETS } from "@/lib/diet";
import { MEMBER_EMOJIS } from "@/lib/mock-settings";
import type { MemberProfile } from "@/lib/settings-types";
import type { Diet, Member } from "@/lib/types";
import { FIELD, MONO, cx } from "../../theme/styles";
import { Chip, FormField } from "../../ui/Controls";
import { KIND_LABELS, dietLabel, optionsFrom } from "../labels";
import { Select } from "../ui/Select";

const KIND_OPTIONS = optionsFrom<Member["kind"]>(KIND_LABELS);
const SAME_AS_HOUSEHOLD = "haushalt";

export interface MemberFieldsProps {
  member: MemberProfile;
  onPatch: (changes: Partial<MemberProfile>) => void;
}

/** Pflichtangaben: Name, Piktogramm, Typ, Geburtsjahr und Ernährungsform (Standard „wie Haushalt“). */
export function MemberBasicsFields({ member, householdDiet, onPatch }: MemberFieldsProps & { householdDiet: Diet }) {
  const dietOptions = [
    { key: SAME_AS_HOUSEHOLD, label: `Wie Haushalt (${dietLabel(householdDiet)})` },
    ...DIETS.map((key) => ({ key, label: dietLabel(key) })),
  ];

  return (
    <div data-tile className="space-y-4">
      <FormField label="Name" htmlFor="d6-member-name">
        <input id="d6-member-name" className={FIELD} value={member.name} onChange={(e) => onPatch({ name: e.target.value })} />
      </FormField>
      <FormField label="Piktogramm">
        <div className="flex flex-wrap gap-1.5">
          {MEMBER_EMOJIS.map((emoji) => (
            <Chip key={emoji} active={member.emoji === emoji} onClick={() => onPatch({ emoji })} className="px-2.5 text-lg">
              {emoji}
            </Chip>
          ))}
        </div>
      </FormField>
      <FormField label="Typ">
        <div className="flex flex-wrap gap-1.5">
          {KIND_OPTIONS.map(({ key, label }) => (
            <Chip key={key} active={member.kind === key} onClick={() => onPatch({ kind: key })}>
              {label}
            </Chip>
          ))}
        </div>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Geburtsjahr" htmlFor="d6-member-year">
          <input
            id="d6-member-year"
            type="number"
            inputMode="numeric"
            min={1900}
            max={2026}
            className={cx(FIELD, MONO)}
            value={member.birthYear}
            onChange={(e) => onPatch({ birthYear: Number(e.target.value) })}
          />
        </FormField>
        <FormField label="Ernährungsform" htmlFor="d6-member-diet">
          <Select<string>
            id="d6-member-diet"
            label="Ernährungsform"
            value={member.diet ?? SAME_AS_HOUSEHOLD}
            options={dietOptions}
            onChange={(key) => onPatch({ diet: DIETS.find((d) => d === key) })}
            className="w-full"
          />
        </FormField>
      </div>
      {member.kind === "baby" && (
        <p className="px-1 text-xs text-(--d6-muted)">Babys haben einen eigenen Sonderbedarf und zählen nicht in die normalen Warengruppen.</p>
      )}
    </div>
  );
}
