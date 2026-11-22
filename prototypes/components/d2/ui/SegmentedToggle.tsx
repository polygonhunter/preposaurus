"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { LucideIcon } from "lucide-react";
import { prefersReducedMotion } from "../motion";
import { cx } from "../theme";

interface SegmentedToggleProps<T extends string> {
  options: { value: T; label: string; icon: LucideIcon }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

/** Zwei-/Mehrfach-Umschalter mit gleitender, leuchtender Markierung. */
export function SegmentedToggle<T extends string>({ options, value, onChange, label }: SegmentedToggleProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const activeIndex = options.findIndex((o) => o.value === value);

  useGSAP(
    () => {
      gsap.to("[data-thumb]", {
        xPercent: activeIndex * 100,
        duration: prefersReducedMotion() ? 0 : 0.4,
        ease: "power3.out",
      });
    },
    { scope: rootRef, dependencies: [activeIndex] },
  );

  return (
    <div ref={rootRef} role="radiogroup" aria-label={label} className="relative flex rounded-xl border border-white/10 bg-black/40 p-1">
      <span
        data-thumb
        aria-hidden
        className="absolute top-1 bottom-1 left-1 rounded-lg border border-(--d2-accent)/50 bg-(--d2-accent-soft) shadow-[0_0_18px_-6px_var(--d2-accent)]"
        style={{ width: `calc((100% - 0.5rem) / ${options.length})` }}
      />
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
        <button
          key={optionValue}
          type="button"
          role="radio"
          aria-checked={optionValue === value}
          onClick={() => onChange(optionValue)}
          className={cx(
            "relative flex flex-1 items-center justify-center gap-2 py-2 text-sm transition-colors",
            optionValue === value ? "text-(--d2-accent)" : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          <Icon className="size-4" /> {optionLabel}
        </button>
      ))}
    </div>
  );
}
