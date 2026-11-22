"use client";

import { useRef, type ReactNode } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "../motion";

interface SegmentedToggleProps<T extends string> {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Umschalter mit hüpfendem Knubbel unter der aktiven Option. */
export function SegmentedToggle<T extends string>({ options, value, onChange, label }: SegmentedToggleProps<T>) {
  const scope = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  useGSAP(
    () => {
      gsap.to(knob.current, {
        xPercent: index * 100,
        duration: prefersReducedMotion() ? 0 : 0.6,
        ease: "elastic.out(1, 0.6)",
      });
    },
    { scope, dependencies: [index] },
  );

  return (
    <div
      ref={scope}
      role="tablist"
      aria-label={label}
      className="relative flex rounded-2xl border-2 border-(--d5-line) bg-(--d5-soft) p-1"
    >
      <span
        ref={knob}
        aria-hidden
        className="absolute inset-y-1 left-1 rounded-xl bg-white shadow-[0_3px_0_var(--d5-line)]"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})` }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 flex flex-1 items-center justify-center gap-2 py-2 text-sm font-extrabold transition-colors ${
            option.value === value ? "text-(--d5-ink)" : "text-(--d5-muted)"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
