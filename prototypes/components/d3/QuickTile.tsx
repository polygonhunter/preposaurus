import type { LucideIcon } from "lucide-react";
import { GlassTile } from "./GlassTile";

interface QuickTileProps {
  flipId: string;
  icon: LucideIcon;
  title: string;
  detail: string;
  onOpen: (tile: HTMLElement | null) => void;
}

/** Kleine Kachel, die als Ganzes in ihren Screen übergeht. */
export function QuickTile({ flipId, icon: Icon, title, detail, onOpen }: QuickTileProps) {
  return (
    <GlassTile flipId={flipId} className="p-0">
      <button
        type="button"
        onClick={(event) => onOpen(event.currentTarget.closest<HTMLElement>("[data-tile]"))}
        className="flex h-full w-full flex-col justify-between gap-6 rounded-[28px] p-4 text-left transition active:scale-[0.98]"
      >
        <span className="grid size-10 place-items-center rounded-2xl bg-slate-900 text-white">
          <Icon size={18} />
        </span>
        <span>
          <span className="block text-[15px] font-semibold">{title}</span>
          <span className="block text-xs text-slate-500">{detail}</span>
        </span>
      </button>
    </GlassTile>
  );
}
