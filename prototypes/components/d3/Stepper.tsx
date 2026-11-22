"use client";

import { useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { popFeedback } from "./motion";

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
}

export function Stepper({ value, onChange, min = 1, max = 99, label }: StepperProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const change = (next: number) => {
    onChange(Math.min(max, Math.max(min, next)));
    popFeedback(valueRef.current);
  };

  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 p-1">
      <button type="button" aria-label="weniger" disabled={value <= min} onClick={() => change(value - 1)}
        className="grid size-8 place-items-center rounded-full bg-white shadow-sm transition active:scale-90 disabled:opacity-40">
        <Minus size={15} />
      </button>
      <span ref={valueRef} className="inline-block min-w-8 text-center text-base font-semibold tabular-nums">{value}</span>
      <button type="button" aria-label="mehr" disabled={value >= max} onClick={() => change(value + 1)}
        className="grid size-8 place-items-center rounded-full bg-white shadow-sm transition active:scale-90 disabled:opacity-40">
        <Plus size={15} />
      </button>
    </div>
  );
}
