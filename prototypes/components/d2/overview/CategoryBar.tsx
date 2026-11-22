import { getCategory } from "@/lib/categories";
import { formatAmount, type CategoryProgress } from "@/lib/supply";
import { MONO, levelColor } from "../theme";

/** Skala reicht bis 150 %, damit Überschuss sichtbar bleibt; die 100-%-Marke ist eingezeichnet. */
const SCALE_MAX = 150;
const TARGET_MARK = (100 / SCALE_MAX) * 100;

/** Ein Balken je Warengruppe, inkl. Überschuss über 100 %. */
export function CategoryBar({ progress }: { progress: CategoryProgress }) {
  const { unit } = getCategory(progress.key);
  const width = (Math.min(progress.percent, SCALE_MAX) / SCALE_MAX) * 100;
  const color = levelColor(progress.percent);
  const surplus = progress.percent - 100;

  return (
    <li data-reveal>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="truncate text-zinc-300">
          <span aria-hidden className="mr-1.5">{progress.emoji}</span>
          {progress.label}
        </span>
        <span className={`${MONO} text-xs`} style={{ color }}>
          {progress.percent} %{surplus > 0 && <span className="ml-1 text-zinc-500">(+{surplus})</span>}
        </span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-white/[0.05]">
        <div
          data-bar
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${width}%`, background: color, boxShadow: `0 0 12px ${color}` }}
        />
        <span aria-hidden className="absolute -inset-y-1 w-px bg-white/40" style={{ left: `${TARGET_MARK}%` }} />
      </div>
      <p className={`${MONO} mt-1 text-[11px] text-zinc-500`}>
        {formatAmount(progress.current, unit)} / {formatAmount(Math.round(progress.target), unit)}
      </p>
    </li>
  );
}
