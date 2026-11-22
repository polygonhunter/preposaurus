import type { CSSProperties } from "react";
import type { Ampel } from "@/lib/types";

/** Monospace-Zahlen mit fester Ziffernbreite – das „Instrument“-Gefühl. */
export const MONO = "font-(family-name:--d2-mono) tabular-nums";

/** Kleine Großbuchstaben-Beschriftung wie auf einem Instrumentenpanel. */
export const LABEL = "font-(family-name:--d2-mono) text-[10px] uppercase tracking-[0.18em] text-zinc-500";

export const BUTTON_PRIMARY =
  "rounded-xl bg-(--d2-accent) px-4 py-2.5 text-sm font-medium text-black shadow-[0_0_24px_-6px_var(--d2-accent)] transition hover:brightness-110 disabled:opacity-30";

export const BUTTON_SECONDARY =
  "rounded-xl border border-white/10 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-white/25";

export const THEME_VARS = {
  "--d2-bg": "#05070a",
  "--d2-panel": "#0b1014",
  "--d2-accent": "#3ee6ff",
  "--d2-accent-soft": "rgba(62, 230, 255, 0.14)",
  "--d2-surplus": "#b4f34a",
  "--d2-grid": "rgba(148, 197, 214, 0.06)",
} as CSSProperties;

/** Feines Gitter als Hintergrund des Panels. */
export const GRID_BACKDROP: CSSProperties = {
  backgroundImage:
    "linear-gradient(var(--d2-grid) 1px, transparent 1px), linear-gradient(90deg, var(--d2-grid) 1px, transparent 1px)",
  backgroundSize: "28px 28px",
};

export const AMPEL_STYLE: Record<Ampel, { color: string; label: string }> = {
  gruen: { color: "#4ade80", label: "haltbar" },
  gelb: { color: "#facc15", label: "bald verbrauchen" },
  orange: { color: "#fb923c", label: "dringend" },
  rot: { color: "#f87171", label: "MHD überschritten" },
};

/** Farbe eines Füllstands: knapp → orange, unterwegs → Akzent, erfüllt → Überschuss-Grün. */
export function levelColor(percent: number): string {
  if (percent >= 100) return "var(--d2-surplus)";
  if (percent >= 50) return "var(--d2-accent)";
  return AMPEL_STYLE.orange.color;
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
