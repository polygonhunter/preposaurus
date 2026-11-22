import type { Ampel } from "@/lib/types";

const AMPEL_STYLES: Record<Ampel, { dot: string; text: string; label: string }> = {
  gruen: { dot: "bg-emerald-400 shadow-emerald-400/50", text: "text-emerald-700", label: "gut haltbar" },
  gelb: { dot: "bg-amber-300 shadow-amber-300/60", text: "text-amber-700", label: "bald fällig" },
  orange: { dot: "bg-orange-400 shadow-orange-400/50", text: "text-orange-700", label: "jetzt verbrauchen" },
  rot: { dot: "bg-rose-500 shadow-rose-500/50", text: "text-rose-700", label: "abgelaufen" },
};

interface AmpelDotProps {
  ampel: Ampel;
  withLabel?: boolean;
}

export function AmpelDot({ ampel, withLabel = false }: AmpelDotProps) {
  const style = AMPEL_STYLES[ampel];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span aria-hidden className={`size-2.5 rounded-full shadow-[0_0_10px] ${style.dot}`} />
      {withLabel ? style.label : <span className="sr-only">{style.label}</span>}
    </span>
  );
}
