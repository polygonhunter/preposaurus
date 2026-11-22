import { FIELD, FieldLabel } from "./Field";

export interface MonthYear {
  month: number; // 1–12
  year: number;
}

interface MhdPickerProps {
  value: MonthYear;
  today: string;
  onChange: (value: MonthYear) => void;
}

const QUICK_OFFSETS = [
  { label: "+6 Mon.", months: 6 },
  { label: "+1 J.", months: 12 },
  { label: "+2 J.", months: 24 },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export function addMonths(fromIso: string, months: number): MonthYear {
  const [year, month] = fromIso.split("-").map(Number);
  const index = year * 12 + (month - 1) + months;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** MHD als Monat/Jahr mit Schnellknöpfen ab heute. */
export function MhdPicker({ value, today, onChange }: MhdPickerProps) {
  const currentYear = Number(today.slice(0, 4));
  const years = Array.from({ length: 8 }, (_, i) => currentYear + i);

  return (
    <fieldset className="grid gap-2">
      <FieldLabel as="legend">MHD (Monat / Jahr)</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Monat"
          className={FIELD}
          value={value.month}
          onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {String(m).padStart(2, "0")}
            </option>
          ))}
        </select>
        <select
          aria-label="Jahr"
          className={FIELD}
          value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        {QUICK_OFFSETS.map((quick) => (
          <button
            key={quick.label}
            type="button"
            onClick={() => onChange(addMonths(today, quick.months))}
            className="flex-1 rounded-lg border border-white/10 py-1.5 font-(family-name:--d2-mono) text-xs text-zinc-300 transition hover:border-(--d2-accent)/60 hover:text-(--d2-accent)"
          >
            {quick.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
