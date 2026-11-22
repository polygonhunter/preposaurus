import type { Ampel } from "@/lib/types";
import { AMPEL_STYLE, cx } from "../theme";

interface AmpelDotProps {
  ampel: Ampel;
  showLabel?: boolean;
  className?: string;
}

/** Leuchtender Ampelpunkt für den MHD-Status, optional mit Beschriftung. */
export function AmpelDot({ ampel, showLabel = false, className }: AmpelDotProps) {
  const { color, label } = AMPEL_STYLE[ampel];
  return (
    <span className={cx("inline-flex items-center gap-1.5", className)} title={label}>
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      />
      {showLabel ? <span style={{ color }}>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}
