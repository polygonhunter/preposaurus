import { needsB12Hint } from "@/lib/diet";
import type { DietState } from "../data/use-diet";
import { KIND_LABELS, memberDietText } from "../settings/labels";
import { B12Hint } from "../ui/B12Hint";
import { EditLink } from "../ui/EditLink";
import { GlassTile } from "../ui/GlassTile";

interface HouseholdTileProps {
  diet: DietState;
  onEdit: (tile: HTMLElement | null) => void;
}

/** Haushalt, für den gerechnet wird: nur anzeigen. Geändert wird in Einstellungen → Haushalt → Mitglieder. */
export function HouseholdTile({ diet, onEdit }: HouseholdTileProps) {
  const { members, householdDiet } = diet;

  return (
    <GlassTile
      flipId="tile-einstellungen"
      label={`Haushalt · ${members.length}`}
      aside={<EditLink label="Mitglieder in den Einstellungen bearbeiten" onEdit={onEdit} />}
      className="col-span-2"
    >
      <ul className="divide-y divide-(--d6-line)">
        {members.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-(--d6-glass-strong) text-lg ring-2 ring-(--d6-glass-border)">
              {m.emoji}
            </span>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-medium">{m.name}</p>
              <p className="text-xs text-(--d6-subtle)">{KIND_LABELS[m.kind]}</p>
            </div>
            <p className={m.diet ? "text-xs font-medium text-(--d6-accent-text)" : "text-xs text-(--d6-muted)"}>
              {memberDietText(m, householdDiet)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-relaxed text-(--d6-subtle)">
        Ziele werden pro Person nach Ernährungsform berechnet und summiert.
      </p>
      {needsB12Hint(members, householdDiet) && <B12Hint className="mt-2" />}
    </GlassTile>
  );
}
