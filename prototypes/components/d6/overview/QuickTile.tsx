import type { LucideIcon } from "lucide-react";
import { INK_ICON, MONO } from "../theme/styles";
import { GlassTile } from "../ui/GlassTile";

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
    <GlassTile flipId={flipId} padding="p-0">
      <button
        type="button"
        onClick={(event) => onOpen(event.currentTarget.closest<HTMLElement>("[data-tile]"))}
        className="flex size-full flex-col justify-between gap-6 rounded-[28px] p-4 text-left transition active:scale-[0.98]"
      >
        <span className={INK_ICON}>
          <Icon size={18} />
        </span>
        <span>
          <span className="block text-[15px] font-semibold">{title}</span>
          <span className={`${MONO} block text-xs text-(--d6-muted)`}>{detail}</span>
        </span>
      </button>
    </GlassTile>
  );
}
