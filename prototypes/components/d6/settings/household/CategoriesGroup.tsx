import { getCategory } from "@/lib/categories";
import type { UserCategory } from "@/lib/settings-types";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsRow } from "../ui/SettingsRow";

interface CategoriesGroupProps {
  categories: UserCategory[];
  onHiddenChange: (id: string, hidden: boolean) => void;
}

/** Kategorien mit Piktogramm und Warengruppe; ausgeblendete erscheinen nicht bei der Erfassung. */
export function CategoriesGroup({ categories, onHiddenChange }: CategoriesGroupProps) {
  return (
    <SettingsGroup title={`Kategorien · ${categories.length}`} note="Schalter = bei der Erfassung sichtbar.">
      {categories.map((c) => (
        <SettingsRow
          key={c.id}
          kind="toggle"
          emoji={c.emoji}
          label={c.name}
          detail={`Warengruppe: ${getCategory(c.group).label}`}
          checked={!c.hidden}
          onChange={(visible) => onHiddenChange(c.id, !visible)}
        />
      ))}
    </SettingsGroup>
  );
}
