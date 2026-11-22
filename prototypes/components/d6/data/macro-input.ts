import { MACRO_KEYS, type MacroKey } from "@/lib/nutrition";
import type { Macros } from "@/lib/types";

export type MacroInput = Record<MacroKey, string>;

export const EMPTY_MACRO_INPUT: MacroInput = { protein: "", carbs: "", fat: "" };

/** Deutsches Komma erlaubt; leer oder ungültig → null. */
function parseGrams(text: string): number | null {
  const value = Number(text.trim().replace(",", "."));
  return text.trim() === "" || !Number.isFinite(value) || value < 0 ? null : value;
}

/** Nur vollständig ausgefüllte Makros zählen; sonst wird nach Kategorie geschätzt (`undefined`). */
export function parseMacroInput(input: MacroInput): Macros | undefined {
  const values = MACRO_KEYS.map((key) => parseGrams(input[key]));
  if (values.some((v) => v === null)) return undefined;
  const [protein, carbs, fat] = values as number[];
  return { protein, carbs, fat };
}
