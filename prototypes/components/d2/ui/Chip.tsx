import type { ReactNode } from "react";
import { cx } from "../theme";

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** Umschaltbarer Filter-Chip. */
export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cx(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap transition-colors",
        active
          ? "border-(--d2-accent)/60 bg-(--d2-accent-soft) text-(--d2-accent) shadow-[0_0_16px_-6px_var(--d2-accent)]"
          : "border-white/10 text-zinc-400 hover:border-white/25 hover:text-zinc-200",
      )}
    >
      {children}
    </button>
  );
}
