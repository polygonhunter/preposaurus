import { shiftMonths } from "./stock";
import { CHIP, LABEL } from "./styles";
import { INPUT } from "./FormField";

const QUICK_SHIFTS = [
  { label: "+6 Mon.", months: 6 },
  { label: "+1 J.", months: 12 },
  { label: "+2 J.", months: 24 },
];
const YEARS_AHEAD = 8;
const MONTH_NAMES = Array.from({ length: 12 }, (_, i) =>
  new Date(Date.UTC(2000, i, 1)).toLocaleDateString("de-DE", { month: "long", timeZone: "UTC" }),
);

export interface MonthYear {
  year: number;
  month: number;
}

interface MhdPickerProps {
  today: string;
  value: MonthYear;
  onChange: (value: MonthYear) => void;
}

/** MHD als Monat/Jahr, mit Schnellknöpfen relativ zu heute. */
export function MhdPicker({ today, value, onChange }: MhdPickerProps) {
  const firstYear = new Date(today).getUTCFullYear();
  const years = Array.from({ length: YEARS_AHEAD + 1 }, (_, i) => firstYear + i);

  return (
    <fieldset className="space-y-1.5">
      <legend className={`${LABEL} mb-1.5 px-1`}>MHD (Monat / Jahr)</legend>
      <div className="grid grid-cols-[1.4fr_1fr] gap-2">
        <select aria-label="Monat" className={INPUT} value={value.month}
          onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>{name}</option>
          ))}
        </select>
        <select aria-label="Jahr" className={INPUT} value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}>
          {years.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        {QUICK_SHIFTS.map(({ label, months }) => {
          const target = shiftMonths(today, months);
          const active = target.year === value.year && target.month === value.month;
          return (
            <button key={label} type="button" onClick={() => onChange(target)}
              className={`${CHIP} flex-1 ${active ? "bg-slate-900 text-white" : "bg-white/70 text-slate-700"}`}>
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
