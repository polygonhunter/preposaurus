import { formatNumber } from "../data/format";
import { cx } from "../theme/styles";

interface SegmentBarProps {
  value: number;
  total: number;
}

/** Ziel als Segmentleiste: ein Segment = ein Tag, angebrochene Tage teilweise gefüllt (Design 2). */
export function SegmentBar({ value, total }: SegmentBarProps) {
  return (
    <div
      role="img"
      aria-label={`${formatNumber(value, 1)} von ${total} Tagen`}
      className="grid gap-1"
      style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, i) => {
        const fill = Math.min(Math.max(value - i, 0), 1);
        return (
          <span key={i} className="relative h-6 overflow-hidden rounded-[7px] bg-(--d6-track)">
            <span
              data-bar
              className={cx(
                "absolute inset-y-0 left-0 bg-linear-to-t from-(--d6-accent) to-(--d6-accent-2) transition-[width] duration-700",
                fill === 1 && "shadow-[0_0_12px_var(--d6-glow)]",
              )}
              style={{ width: `${fill * 100}%` }}
            />
          </span>
        );
      })}
    </div>
  );
}
