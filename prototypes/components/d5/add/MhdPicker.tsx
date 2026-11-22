import { ChunkyButton } from "../ui/ChunkyButton";
import { FIELD } from "./form-styles";

export interface MonthYear {
  month: number;
  year: number;
}

interface MhdPickerProps {
  value: MonthYear;
  today: string;
  onChange: (value: MonthYear) => void;
}

const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
const QUICK = [
  { label: "+6 Mon.", months: 6 },
  { label: "+1 J.", months: 12 },
  { label: "+2 J.", months: 24 },
];

/** Monat/Jahr ab heute plus n Monate. */
export function monthsFromToday(today: string, months: number): MonthYear {
  const index = Number(today.slice(0, 4)) * 12 + Number(today.slice(5, 7)) - 1 + months;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/** MHD als Monat/Jahr mit Schnellknöpfen. */
export function MhdPicker({ value, today, onChange }: MhdPickerProps) {
  const startYear = Number(today.slice(0, 4));
  const years = Array.from({ length: 8 }, (_, i) => startYear + i);

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-extrabold">Mindestens haltbar bis</legend>
      <div className="grid grid-cols-2 gap-2">
        <select
          aria-label="Monat"
          className={FIELD}
          value={value.month}
          onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
        >
          {MONTHS.map((label, i) => (
            <option key={label} value={i + 1}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="Jahr"
          className={FIELD}
          value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        {QUICK.map((quick) => (
          <ChunkyButton
            key={quick.label}
            tone="yellow"
            size="sm"
            className="flex-1"
            onClick={() => onChange(monthsFromToday(today, quick.months))}
          >
            {quick.label}
          </ChunkyButton>
        ))}
      </div>
    </fieldset>
  );
}
