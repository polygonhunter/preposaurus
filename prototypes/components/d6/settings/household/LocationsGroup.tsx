"use client";

import { useState, type FormEvent } from "react";
import { MapPin, Plus, X } from "lucide-react";
import { FIELD, cx } from "../../theme/styles";
import { SettingsGroup } from "../ui/SettingsGroup";
import { SettingsRow } from "../ui/SettingsRow";

interface LocationsGroupProps {
  locations: string[];
  onChange: (locations: string[]) => void;
}

/** Lagerorte: hinzufügen und entfernen. */
export function LocationsGroup({ locations, onChange }: LocationsGroupProps) {
  const [draft, setDraft] = useState("");
  const name = draft.trim();
  const canAdd = name.length > 0 && !locations.includes(name);

  const add = (event: FormEvent) => {
    event.preventDefault();
    if (!canAdd) return;
    onChange([...locations, name]);
    setDraft("");
  };

  return (
    <SettingsGroup title="Lagerorte" note="Ware im Gefrierschrank zählt nicht zum Notvorrat (Stromausfall).">
      {locations.map((location) => (
        <SettingsRow key={location} kind="value" icon={MapPin} label={location}>
          <button
            type="button"
            aria-label={`${location} entfernen`}
            disabled={locations.length <= 1}
            onClick={() => onChange(locations.filter((l) => l !== location))}
            className="grid size-7 place-items-center rounded-full border border-(--d6-line) text-(--d6-muted) transition hover:text-(--d6-accent-text) active:scale-90 disabled:opacity-40"
          >
            <X className="size-3.5" />
          </button>
        </SettingsRow>
      ))}
      <form onSubmit={add} className="flex items-center gap-2 p-3">
        <input
          aria-label="Neuer Lagerort"
          placeholder="z. B. Abstellraum"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={cx(FIELD, "rounded-full py-1.5 text-sm")}
        />
        <button
          type="submit"
          disabled={!canAdd}
          aria-label="Lagerort hinzufügen"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-(--d6-ink) text-(--d6-on-ink) transition active:scale-90 disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </form>
    </SettingsGroup>
  );
}
