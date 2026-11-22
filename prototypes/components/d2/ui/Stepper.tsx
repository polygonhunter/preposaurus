import { Minus, Plus } from "lucide-react";
import { MONO } from "../theme";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

const BUTTON =
  "grid size-9 place-items-center rounded-lg border border-white/10 text-zinc-300 transition hover:border-(--d2-accent)/50 hover:text-(--d2-accent) disabled:opacity-30";

/** −/+ Zähler für Stückzahlen. */
export function Stepper({ value, onChange, min = 1, max = 99, label }: StepperProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" className={BUTTON} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label="weniger">
        <Minus className="size-4" />
      </button>
      <output className={`${MONO} w-8 text-center text-lg text-zinc-100`}>{value}</output>
      <button type="button" className={BUTTON} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label="mehr">
        <Plus className="size-4" />
      </button>
    </div>
  );
}
