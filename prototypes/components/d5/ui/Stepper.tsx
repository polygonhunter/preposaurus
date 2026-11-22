import { Minus, Plus } from "lucide-react";
import { ChunkyButton } from "./ChunkyButton";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

/** Plus/Minus-Zähler mit dicken Knöpfen. */
export function Stepper({ value, onChange, min = 1, max = 99, label }: StepperProps) {
  return (
    <div className="flex items-center gap-3" role="group" aria-label={label}>
      <ChunkyButton tone="blue" size="sm" aria-label="weniger" disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Minus className="size-5" strokeWidth={3} />
      </ChunkyButton>
      <span className="min-w-10 text-center text-2xl font-black tabular-nums" aria-live="polite">
        {value}
      </span>
      <ChunkyButton tone="blue" size="sm" aria-label="mehr" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Plus className="size-5" strokeWidth={3} />
      </ChunkyButton>
    </div>
  );
}
