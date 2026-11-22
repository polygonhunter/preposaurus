import type { Ampel } from "@/lib/types";
import { AMPEL_TONE, toneVars } from "../theme";

interface AmpelBadgeProps {
  ampel: Ampel;
  /** Optionaler Zusatz, z. B. das Datum */
  detail?: string;
  /** Nur Punkt + Detail, Text bleibt für Screenreader erhalten */
  compact?: boolean;
}

/** Ampel-Pille für ein MHD: Farbe + kurzer, ruhiger Text. */
export function AmpelBadge({ ampel, detail, compact = false }: AmpelBadgeProps) {
  const { tone, label } = AMPEL_TONE[ampel];
  return (
    <span
      style={toneVars(tone)}
      className="inline-flex items-center gap-1.5 rounded-full bg-(--tone) px-2.5 py-0.5 text-xs font-extrabold text-(--tone-ink) shadow-[0_2px_0_var(--tone-edge)]"
    >
      <span aria-hidden className="size-2 rounded-full bg-(--tone-ink) opacity-80" />
      <span className={compact ? "sr-only" : undefined}>{label}</span>
      {detail && <span className="font-bold opacity-90">{compact ? detail : `· ${detail}`}</span>}
    </span>
  );
}
