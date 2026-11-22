import type { Role } from "@/lib/settings-types";
import { BADGE, cx } from "../../theme/styles";
import { SegmentedControl } from "../../ui/SegmentedControl";
import { ROLE_LABELS } from "../labels";

const OPTIONS = (Object.keys(ROLE_LABELS) as Role[]).map((key) => ({ key, label: ROLE_LABELS[key] }));

/** Nur im Prototyp: zeigt, was ein Mitglied ohne Admin-Rechte sieht. */
export function DemoRoleSwitch({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <div data-tile className="flex flex-wrap items-center justify-between gap-2 rounded-[24px] border border-dashed border-(--d6-accent)/50 px-4 py-3">
      <p className="text-sm">
        <span className={cx(BADGE, "mr-2 bg-(--d6-accent-soft) text-(--d6-accent-text)")}>Demo</span>
        Ansicht als
      </p>
      <SegmentedControl size="sm" label="Ansicht als (Demo)" value={value} onChange={onChange} options={OPTIONS} />
    </div>
  );
}
