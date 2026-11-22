import { getCategory } from "@/lib/categories";
import { formatAmount, type CategoryProgress } from "@/lib/supply";
import { MONO, levelTone } from "../theme/styles";

/** Skala bis 150 %, damit Überschuss sichtbar bleibt; die 100-%-Marke ist eingezeichnet. */
const SCALE_MAX = 150;
const toScale = (percent: number) => `${(Math.min(Math.max(percent, 0), SCALE_MAX) / SCALE_MAX) * 100}%`;
const TARGET_MARK = toScale(100);

/** Erfüllungsbalken je Warengruppe; über 100 % leuchtet der Überschuss grün. */
export function LevelBar({ progress }: { progress: CategoryProgress }) {
  const { unit } = getCategory(progress.key);
  const tone = levelTone(progress.percent);
  const surplus = progress.percent - 100;

  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 text-[13px]">
        <span className="truncate text-(--d6-text)">
          <span aria-hidden className="mr-1.5">{progress.emoji}</span>
          {progress.label}
        </span>
        <span className={`${MONO} shrink-0 text-xs font-medium`} style={{ color: tone.text }}>
          {progress.percent} %{surplus > 0 && <span className="ml-1 text-(--d6-subtle)">(+{surplus})</span>}
        </span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-(--d6-track)">
        <div
          data-bar
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700"
          style={{ width: toScale(Math.min(progress.percent, 100)), background: tone.fill, boxShadow: `0 0 10px ${tone.fill}` }}
        />
        {surplus > 0 && (
          <div
            data-bar
            className="absolute inset-y-0 rounded-r-full bg-(--d6-surplus) shadow-[0_0_14px_var(--d6-surplus)] transition-[width] duration-700"
            style={{ left: TARGET_MARK, width: toScale(Math.min(surplus, SCALE_MAX - 100)) }}
          />
        )}
        <span aria-hidden className="absolute -inset-y-1 w-px bg-(--d6-subtle)/60" style={{ left: TARGET_MARK }} />
      </div>
      <p className={`${MONO} mt-1 text-[11px] text-(--d6-subtle)`}>
        {formatAmount(progress.current, unit)} / {formatAmount(Math.round(progress.target), unit)}
      </p>
    </li>
  );
}
