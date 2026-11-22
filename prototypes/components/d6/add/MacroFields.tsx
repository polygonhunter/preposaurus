import { MACRO_KEYS, MACRO_LABELS } from "@/lib/nutrition";
import type { Macros, Unit } from "@/lib/types";
import { formatNumber } from "../data/format";
import type { MacroInput } from "../data/macro-input";
import { FIELD, LABEL, MONO } from "../theme/styles";

interface MacroFieldsProps {
  value: MacroInput;
  onChange: (value: MacroInput) => void;
  /** Vorschlag (Ø der Kategorie), erscheint als Platzhalter */
  estimate: Macros;
  unit: Unit;
}

/** Eiweiß, Kohlenhydrate, Fett je 100 g/ml – optional, leer = geschätzt. */
export function MacroFields({ value, onChange, estimate, unit }: MacroFieldsProps) {
  return (
    <fieldset className="space-y-1.5">
      <legend className={`${LABEL} block px-1`}>Eiweiß · KH · Fett je 100 {unit} (optional)</legend>
      <div className="grid grid-cols-3 gap-2">
        {MACRO_KEYS.map((key) => (
          <label key={key} className="block">
            <span className="mb-1 block px-1 text-[11px] text-(--d6-muted)">{MACRO_LABELS[key].label}</span>
            <input
              type="text"
              inputMode="decimal"
              className={`${FIELD} ${MONO}`}
              value={value[key]}
              placeholder={`≈ ${formatNumber(estimate[key], 1)}`}
              onChange={(e) => onChange({ ...value, [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
