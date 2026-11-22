import type { Product, StockUnit } from "@/lib/types";

export type CaptureStep = "verpackung" | "naehrwerte" | "mhd" | "pruefen";

export const CAPTURE_STEPS: { key: CaptureStep; label: string; hint: string }[] = [
  { key: "verpackung", label: "Verpackung", hint: "Vorderseite der Packung ins Bild halten" },
  { key: "naehrwerte", label: "Nährwerte", hint: "Nährwerttabelle zeigen – optional" },
  { key: "mhd", label: "MHD-Serie", hint: "Packung für Packung das Datum zeigen" },
  { key: "pruefen", label: "Prüfen", hint: "" },
];

/** Simulierte Erkennungsdauer in Sekunden (keine echte Kamera/KI). */
export const RECOGNITION_DELAY_S = 0.9;

/** Simulierte Datums-Lesungen je MHD-Foto; `null` = nicht sicher lesbar. */
const SIMULATED_MHD_READS: (string | null)[] = [
  "2027-09-30",
  "2027-09-30",
  "2027-09-23",
  null,
  "2027-09-30",
  "2027-09-30",
  "2027-11-30",
  "2027-11-30",
  "2027-11-30",
  "2027-11-30",
];

export const MAX_MHD_PHOTOS = SIMULATED_MHD_READS.length;

export interface MhdRead {
  id: string;
  mhd: string;
  needsCheck: boolean;
}

/** Liefert die n-te simulierte Lesung; Unlesbares bekommt das vorige Datum als Vorschlag. */
export function simulateMhdRead(index: number, previous: MhdRead | undefined): MhdRead {
  const read = SIMULATED_MHD_READS[index];
  const fallback = previous?.mhd ?? SIMULATED_MHD_READS[0] ?? "";
  return { id: `read-${index}`, mhd: read ?? fallback, needsCheck: read === null };
}

/** Baut aus Vorlage und erfassten MHDs das zu speichernde Produkt. */
export function buildCapturedProduct(template: Product, mhds: string[], stamp: number): Product {
  const units: StockUnit[] = mhds.map((mhd, i) => ({ id: `${template.id}-scan-${stamp}-${i}`, mhd }));
  return { ...template, units };
}
