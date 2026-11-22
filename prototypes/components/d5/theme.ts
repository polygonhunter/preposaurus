import type { CSSProperties } from "react";
import type { Ampel, CategoryKey } from "@/lib/types";

export type Tone = "green" | "blue" | "yellow" | "orange" | "red" | "purple" | "pink";

/** Farbpaare (Fläche + dunklere Unterkante) für die „chunky“ Optik. */
export const TONES: Record<Tone, { fill: string; edge: string; ink: string }> = {
  green: { fill: "#4CC66A", edge: "#2F9E4C", ink: "#FFFFFF" },
  blue: { fill: "#3BA9F5", edge: "#1F86D0", ink: "#FFFFFF" },
  yellow: { fill: "#FFC93C", edge: "#D9A21C", ink: "#5A3E00" },
  orange: { fill: "#FF9F43", edge: "#D97A1E", ink: "#FFFFFF" },
  red: { fill: "#FF5A5F", edge: "#D63A40", ink: "#FFFFFF" },
  purple: { fill: "#9B6BFF", edge: "#7444E0", ink: "#FFFFFF" },
  pink: { fill: "#FF7EB6", edge: "#E0558F", ink: "#FFFFFF" },
};

/** Setzt die Ton-Farben als CSS-Variablen, damit Tailwind-Klassen sie nutzen können. */
export function toneVars(tone: Tone): CSSProperties {
  const { fill, edge, ink } = TONES[tone];
  return { "--tone": fill, "--tone-edge": edge, "--tone-ink": ink } as CSSProperties;
}

export const THEME_VARS = {
  "--d5-bg": "#FFF7E8",
  "--d5-ink": "#33305A",
  "--d5-muted": "#8A86A8",
  "--d5-line": "#EFE5D2",
  "--d5-soft": "#FFF1D6",
} as CSSProperties;

export const CARD = "rounded-3xl border-2 border-(--d5-line) bg-white shadow-[0_4px_0_var(--d5-line)]";

export const AMPEL_TONE: Record<Ampel, { tone: Tone; label: string }> = {
  gruen: { tone: "green", label: "Alles gut" },
  gelb: { tone: "yellow", label: "Bald verbrauchen" },
  orange: { tone: "orange", label: "Jetzt verbrauchen" },
  rot: { tone: "red", label: "MHD prüfen" },
};

export const CATEGORY_TONE: Record<CategoryKey, Tone> = {
  getreide: "yellow",
  gemuese_huelsenfruechte: "green",
  obst_nuesse: "orange",
  milch: "purple",
  fleisch_fisch_eier: "pink",
  fette_oele: "yellow",
  wasser: "blue",
  getraenke: "blue",
  fertiggerichte: "red",
  sonstiges: "orange",
};
