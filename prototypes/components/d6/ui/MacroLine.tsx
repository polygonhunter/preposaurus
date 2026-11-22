import { MACRO_KEYS, MACRO_LABELS, type ResolvedMacros } from "@/lib/nutrition";
import type { Unit } from "@/lib/types";
import { formatNumber } from "../data/format";
import { BADGE, MACRO_COLOR, MONO, cx } from "../theme/styles";

interface MacroLineProps {
  macros: ResolvedMacros;
  unit: Unit;
  className?: string;
}

/** Kompakt „E 13 · K 71 · F 2 g/100 g“, mit Etikett „geschätzt“ bei Kategorie-Durchschnitt. */
export function MacroLine({ macros, unit, className }: MacroLineProps) {
  return (
    <p className={cx(MONO, "flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-(--d6-muted)", className)}>
      {MACRO_KEYS.map((key) => (
        <span key={key} title={MACRO_LABELS[key].label} className="inline-flex items-center gap-1">
          <span aria-hidden className="size-1.5 rounded-full" style={{ background: MACRO_COLOR[key] }} />
          <span className="sr-only">{MACRO_LABELS[key].label}</span>
          <span aria-hidden>{MACRO_LABELS[key].short}</span>
          {formatNumber(macros.per100[key], macros.per100[key] < 10 && macros.per100[key] % 1 !== 0 ? 1 : 0)}
        </span>
      ))}
      <span className="text-(--d6-subtle)">g/100 {unit}</span>
      {macros.estimated && <span className={BADGE}>geschätzt</span>}
    </p>
  );
}
