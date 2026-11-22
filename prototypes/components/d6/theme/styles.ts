import type { Ampel } from "@/lib/types";

/** Wiederverwendbare Klassen; alle Farben kommen aus den Tokens in app/d6/theme.css. */
export const GLASS =
  "border border-(--d6-glass-border) bg-(--d6-glass) shadow-[inset_0_1px_0_var(--d6-highlight),0_14px_40px_-18px_var(--d6-shadow)] backdrop-blur-2xl backdrop-saturate-150";

export const MONO = "font-(family-name:--d6-mono) tabular-nums";

export const LABEL = "font-(family-name:--d6-mono) text-[10.5px] font-medium uppercase tracking-[0.16em] text-(--d6-subtle)";

export const BUTTON_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-(--d6-ink) px-5 py-3 text-sm font-medium text-(--d6-on-ink) shadow-[0_8px_26px_-8px_var(--d6-glow)] transition active:scale-[0.97] disabled:opacity-40";

export const BUTTON_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-full border border-(--d6-line) bg-(--d6-glass-strong) px-5 py-3 text-sm font-medium text-(--d6-text) transition active:scale-[0.97] disabled:opacity-40";

export const CHIP = "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition active:scale-95";

export const CHIP_ON =
  "border-(--d6-accent) bg-(--d6-accent-soft) text-(--d6-accent-text) shadow-[0_0_16px_-6px_var(--d6-glow)]";

export const CHIP_OFF = "border-(--d6-line) bg-(--d6-glass-strong) text-(--d6-muted) hover:text-(--d6-text)";

/** Dunkles Symbol-Feld mit Glow (Schnellzugriffe). */
export const INK_ICON =
  "grid size-10 shrink-0 place-items-center rounded-2xl bg-(--d6-ink) text-(--d6-on-ink) shadow-[0_0_20px_-6px_var(--d6-glow)]";

/** Fläche eines Mini-Instruments; der Engpass leuchtet im Akzent. */
export function readoutSurface(limiting: boolean): string {
  return limiting
    ? "border-(--d6-accent)/50 bg-(--d6-accent-soft) shadow-[0_0_20px_-8px_var(--d6-glow)]"
    : "border-(--d6-line) bg-(--d6-glass-strong)";
}

/** Kleines, ruhiges Etikett, z. B. „geschätzt“. */
export const BADGE = "rounded-full bg-(--d6-track) px-1.5 py-0.5 text-[10px] font-medium text-(--d6-muted)";

export const FIELD =
  "w-full rounded-2xl border border-(--d6-line) bg-(--d6-field) px-3.5 py-2.5 text-[15px] text-(--d6-text) outline-none transition focus:border-(--d6-accent) focus:shadow-[0_0_0_4px_var(--d6-accent-soft)]";

/** Fein gerastertes Instrumenten-Gitter (Design 2). */
export const GRID_LINES =
  "bg-[linear-gradient(var(--d6-grid)_1px,transparent_1px),linear-gradient(90deg,var(--d6-grid)_1px,transparent_1px)] bg-[size:28px_28px]";

/** Farbe je Makronährstoff (Tokens in theme.css). */
export const MACRO_COLOR = { protein: "var(--d6-protein)", carbs: "var(--d6-carbs)", fat: "var(--d6-fat)" } as const;

interface Tone {
  fill: string;
  text: string;
}

export const AMPEL: Record<Ampel, Tone & { label: string }> = {
  gruen: { fill: "var(--d6-ok)", text: "var(--d6-ok-text)", label: "gut haltbar" },
  gelb: { fill: "var(--d6-soon)", text: "var(--d6-soon-text)", label: "bald fällig" },
  orange: { fill: "var(--d6-urgent)", text: "var(--d6-urgent-text)", label: "jetzt verbrauchen" },
  rot: { fill: "var(--d6-expired)", text: "var(--d6-expired-text)", label: "abgelaufen" },
};

/** Füllstand: knapp → orange, unterwegs → Akzent, erfüllt → Überschuss-Grün. */
export function levelTone(percent: number): Tone {
  if (percent >= 100) return { fill: "var(--d6-surplus)", text: "var(--d6-surplus-text)" };
  if (percent >= 50) return { fill: "var(--d6-accent)", text: "var(--d6-accent-text)" };
  return { fill: "var(--d6-low)", text: "var(--d6-low-text)" };
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
