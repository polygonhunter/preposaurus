import type { ReactNode } from "react";
import { toneVars, type Tone } from "../theme";

interface ChipProps {
  active: boolean;
  onClick: () => void;
  tone?: Tone;
  children: ReactNode;
}

/** Runder Filter-Chip; aktiv in kräftiger Farbe mit kleiner Unterkante. */
export function Chip({ active, onClick, tone = "purple", children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={toneVars(tone)}
      className={`shrink-0 whitespace-nowrap rounded-full border-2 px-3.5 py-1.5 text-sm font-extrabold transition-colors ${
        active
          ? "border-(--tone-edge) bg-(--tone) text-(--tone-ink) shadow-[0_3px_0_var(--tone-edge)]"
          : "border-(--d5-line) bg-white text-(--d5-muted) shadow-[0_3px_0_var(--d5-line)]"
      }`}
    >
      {children}
    </button>
  );
}
