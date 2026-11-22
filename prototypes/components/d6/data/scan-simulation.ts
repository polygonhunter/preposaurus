export type CaptureStep = "verpackung" | "naehrwerte" | "mhd" | "pruefen";

export const CAPTURE_STEPS: { key: CaptureStep; label: string; hint: string }[] = [
  { key: "verpackung", label: "Verpackung", hint: "Vorderseite der Packung in den Rahmen halten" },
  { key: "naehrwerte", label: "Nährwerte", hint: "Nährwerttabelle zeigen – optional (kcal, Eiweiß, KH, Fett)" },
  { key: "mhd", label: "MHD-Serie", hint: "Packung für Packung das Datum zeigen" },
  { key: "pruefen", label: "Prüfen", hint: "" },
];

/** Simulierte Erkennungsdauer in Sekunden (keine echte Kamera/KI). */
export const RECOGNITION_DELAY_S = 1.1;

/** Simulierte Datums-Lesungen je MHD-Foto; `null` = nicht sicher lesbar → gelber Chip. */
const SIMULATED_READS: (string | null)[] = [
  "2027-09-30",
  "2027-09-30",
  null,
  "2027-09-30",
  "2027-09-30",
  "2027-11-30",
  "2027-11-30",
  "2027-11-30",
  "2027-11-30",
  "2027-11-30",
];

export const MAX_MHD_PHOTOS = SIMULATED_READS.length;

export interface MhdRead {
  id: string;
  mhd: string;
  needsCheck: boolean;
}

/** n-te simulierte Lesung; Unlesbares bekommt das vorige Datum als Vorschlag. */
export function simulateMhdRead(index: number, previous: MhdRead | undefined): MhdRead {
  const read = SIMULATED_READS[index];
  const fallback = previous?.mhd ?? SIMULATED_READS[0] ?? "";
  return { id: `read-${index}`, mhd: read ?? fallback, needsCheck: read === null };
}
