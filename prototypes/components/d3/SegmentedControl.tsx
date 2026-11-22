"use client";

import type { LucideIcon } from "lucide-react";
import { useFlipPill } from "./motion";

interface SegmentOption<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  flipId: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({ options, value, onChange, flipId, size = "md" }: SegmentedControlProps<T>) {
  const { scope, capture } = useFlipPill(value);
  const padding = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm";

  return (
    <div ref={scope} role="tablist" className="inline-flex rounded-full bg-slate-900/5 p-1">
      {options.map(({ key, label, icon: Icon }) => {
        const isActive = key === value;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              if (isActive) return;
              capture();
              onChange(key);
            }}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full font-medium transition-colors ${padding} ${
              isActive ? "text-slate-900" : "text-slate-500"
            }`}
          >
            {isActive && <span data-pill data-flip-id={flipId} className="absolute inset-0 rounded-full bg-white shadow-sm" />}
            {Icon && <Icon size={15} className="relative" />}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
