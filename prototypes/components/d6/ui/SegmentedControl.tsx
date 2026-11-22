"use client";

import type { LucideIcon } from "lucide-react";
import { useFlipPill } from "../motion/hooks";
import { cx } from "../theme/styles";

interface SegmentOption<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}

/** Umschalter, dessen leuchtende Markierung per Flip zur Auswahl gleitet. */
export function SegmentedControl<T extends string>({ options, value, onChange, label, size = "md", className }: SegmentedControlProps<T>) {
  const { scope, capture } = useFlipPill<HTMLDivElement>(value);
  const padding = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm";

  return (
    <div ref={scope} role="radiogroup" aria-label={label} className={cx("inline-flex rounded-full bg-(--d6-track) p-1", className)}>
      {options.map(({ key, label: optionLabel, icon: Icon }) => {
        const isActive = key === value;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => {
              if (isActive) return;
              capture();
              onChange(key);
            }}
            className={cx(
              "relative flex flex-1 items-center justify-center gap-1.5 rounded-full font-medium transition-colors",
              padding,
              isActive ? "text-(--d6-accent-text)" : "text-(--d6-muted) hover:text-(--d6-text)",
            )}
          >
            {isActive && (
              <span
                data-pill
                className="absolute inset-0 rounded-full border border-(--d6-accent)/40 bg-(--d6-glass-strong) shadow-[0_2px_8px_-2px_var(--d6-shadow),0_0_18px_-6px_var(--d6-glow)]"
              />
            )}
            {Icon && <Icon size={15} className="relative" />}
            <span className="relative">{optionLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
