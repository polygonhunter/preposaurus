"use client";

import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useMagnetic } from "./motion";
import { GLASS } from "./styles";

interface GlassTileProps {
  children: ReactNode;
  className?: string;
  /** Verbindet die Kachel per Flip mit dem Vollbild-Screen gleicher ID. */
  flipId?: string;
  /** Große Formular-Kacheln bleiben ruhig. */
  magnetic?: boolean;
}

export function GlassTile({ children, className = "", flipId, magnetic = true }: GlassTileProps) {
  const ref = useMagnetic<HTMLDivElement>(magnetic ? 0.035 : 0);
  return (
    <div ref={ref} data-tile data-flip-id={flipId} className={`${GLASS} relative rounded-[28px] p-4 ${className}`}>
      {children}
    </div>
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
      className="grid size-8 place-items-center rounded-full bg-white/70 text-slate-600 transition hover:bg-white active:scale-90"
    >
      <ChevronRight size={16} />
    </button>
  );
}
