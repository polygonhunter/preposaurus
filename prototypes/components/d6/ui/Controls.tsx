"use client";

import { useRef, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import type { Ampel } from "@/lib/types";
import { popFeedback } from "../motion/motion";
import { AMPEL, CHIP, CHIP_OFF, CHIP_ON, LABEL, MONO, cx } from "../theme/styles";

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

/** Umschaltbarer Chip (Filter, Behälter, Schnellwahl). */
export function Chip({ active, onClick, children, className }: ChipProps) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cx(CHIP, active ? CHIP_ON : CHIP_OFF, className)}>
      {children}
    </button>
  );
}

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
}

const STEP_BUTTON =
  "grid size-8 place-items-center rounded-full border border-(--d6-line) bg-(--d6-glass-strong) transition hover:text-(--d6-accent-text) active:scale-90 disabled:opacity-40";

/** −/+ Zähler mit federndem Wert. */
export function Stepper({ value, onChange, label, min = 1, max = 99 }: StepperProps) {
  const valueRef = useRef<HTMLOutputElement>(null);
  const change = (next: number) => {
    onChange(Math.min(max, Math.max(min, next)));
    popFeedback(valueRef.current);
  };

  return (
    <div role="group" aria-label={label} className="inline-flex items-center gap-1 rounded-full bg-(--d6-track) p-1">
      <button type="button" aria-label="weniger" disabled={value <= min} onClick={() => change(value - 1)} className={STEP_BUTTON}>
        <Minus size={15} />
      </button>
      <output ref={valueRef} className={`${MONO} inline-block min-w-8 text-center text-base font-semibold`}>
        {value}
      </output>
      <button type="button" aria-label="mehr" disabled={value >= max} onClick={() => change(value + 1)} className={STEP_BUTTON}>
        <Plus size={15} />
      </button>
    </div>
  );
}

/** Leuchtender Ampelpunkt für den MHD-Status, optional mit Beschriftung. */
export function AmpelDot({ ampel, withLabel = false }: { ampel: Ampel; withLabel?: boolean }) {
  const { fill, text, label } = AMPEL[ampel];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: text }} title={label}>
      <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: fill, boxShadow: `0 0 9px ${fill}` }} />
      {withLabel ? label : <span className="sr-only">{label}</span>}
    </span>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}

/** Beschriftetes Formularfeld. */
export function FormField({ label, htmlFor, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className={`${LABEL} block px-1`}>
        {label}
      </label>
      {children}
    </div>
  );
}
