import { ALLERGY_OPTIONS } from "@/lib/mock-settings";
import type { Activity, Condition, Sex } from "@/lib/settings-types";
import { FIELD, LABEL, MONO, cx } from "../../theme/styles";
import { Chip, FormField } from "../../ui/Controls";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { ACTIVITY_LABELS, CONDITION_LABELS, SEX_LABELS, optionsFrom } from "../labels";
import { Select } from "../ui/Select";
import type { MemberFieldsProps } from "./MemberBasicsFields";

const NO_ANSWER = "keine-angabe";
const SEX_OPTIONS = [{ key: NO_ANSWER, label: "keine Angabe" }, ...optionsFrom<Sex>(SEX_LABELS)];
const ACTIVITY_OPTIONS = optionsFrom<Activity>(ACTIVITY_LABELS);
const CONDITION_OPTIONS = optionsFrom<Condition>(CONDITION_LABELS);

function isSex(value: string): value is Sex {
  return value in SEX_LABELS;
}

function toggled(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

/** Optionale Angaben für den Rechenmodus „Individuell“ und den Einkaufsplan. */
export function MemberDetailFields({ member, onPatch }: MemberFieldsProps) {
  return (
    <div data-tile className="space-y-4">
      <p className={cx(LABEL, "px-1 pt-2")}>Optional</p>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Geschlecht" htmlFor="d6-member-sex">
          <Select<string>
            id="d6-member-sex"
            label="Geschlecht"
            value={member.sex ?? NO_ANSWER}
            options={SEX_OPTIONS}
            onChange={(key) => onPatch({ sex: isSex(key) ? key : undefined })}
            className="w-full"
          />
        </FormField>
        <FormField label="Gewicht (kg)" htmlFor="d6-member-weight">
          <input
            id="d6-member-weight"
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="Referenzwert"
            className={cx(FIELD, MONO)}
            value={member.weightKg ?? ""}
            onChange={(e) => onPatch({ weightKg: e.target.value === "" ? undefined : Number(e.target.value) })}
          />
        </FormField>
      </div>
      <FormField label="Aktivität">
        <SegmentedControl label="Aktivität" value={member.activity} options={ACTIVITY_OPTIONS} onChange={(activity) => onPatch({ activity })} className="w-full" />
      </FormField>
      <FormField label="Schwanger / stillend" htmlFor="d6-member-condition">
        <Select
          id="d6-member-condition"
          label="Schwanger / stillend"
          value={member.condition}
          options={CONDITION_OPTIONS}
          onChange={(condition) => onPatch({ condition })}
          className="w-full"
        />
      </FormField>
      <FormField label="Allergien & Unverträglichkeiten">
        <div className="flex flex-wrap gap-1.5">
          {ALLERGY_OPTIONS.map((allergy) => (
            <Chip key={allergy} active={member.allergies.includes(allergy)} onClick={() => onPatch({ allergies: toggled(member.allergies, allergy) })}>
              {allergy}
            </Chip>
          ))}
        </div>
      </FormField>
      <p className="px-1 text-[11px] leading-relaxed text-(--d6-subtle)">
        Geschlecht, Aktivität und Gewicht zählen nur im Rechenmodus „Individuell“. Allergien erscheinen als Hinweis beim Einkauf.
      </p>
    </div>
  );
}
