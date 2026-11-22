import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { GLASS, LABEL, cx } from "../theme/styles";

interface GlassTileProps {
  children: ReactNode;
  className?: string;
  /** Verbindet die Kachel per Flip mit dem Vollbild-Screen gleicher ID. */
  flipId?: string;
  label?: string;
  aside?: ReactNode;
  /** Innenabstand als eigene Klasse, damit er nicht mit `className` kollidiert. */
  padding?: "p-0" | "p-2" | "p-4" | "p-5";
}

/** Glas-Kachel des Bento-Rasters mit optionaler Instrumenten-Beschriftung. */
export function GlassTile({ children, className, flipId, label, aside, padding = "p-4" }: GlassTileProps) {
  return (
    <section
      data-tile
      data-flip-id={flipId}
      className={cx(GLASS, "relative rounded-[28px] transition-[border-color] duration-300 hover:border-(--d6-accent)/40", padding, className)}
    >
      {(label || aside) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {label && <h2 className={LABEL}>{label}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

interface TileOpenButtonProps {
  label: string;
  onOpen: (tile: HTMLElement | null) => void;
}

/** Öffnet die umgebende Kachel als Vollbild-Screen. */
export function TileOpenButton({ label, onOpen }: TileOpenButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => onOpen(event.currentTarget.closest<HTMLElement>("[data-tile]"))}
      className="grid size-8 shrink-0 place-items-center rounded-full border border-(--d6-line) bg-(--d6-glass-strong) text-(--d6-muted) transition hover:text-(--d6-accent-text) active:scale-90"
    >
      <ChevronRight size={16} />
    </button>
  );
}
