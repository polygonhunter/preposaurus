import type { Product } from "@/lib/types";

/** Simulierte KI-Lesungen der MHD-Serie (keine echte Kamera/KI im Prototyp). */
export const SIMULATED_MHD_READS: { mhd: string; uncertain: boolean }[] = [
  ...Array.from({ length: 6 }, (_, i) => ({ mhd: "2027-09-23", uncertain: i === 4 })),
  ...Array.from({ length: 4 }, () => ({ mhd: "2027-11-30", uncertain: false })),
];

export interface ScannedDate {
  mhd: string;
  uncertain: boolean;
}

export type ProductDraft = Omit<Product, "id" | "units" | "location">;

let draftCounter = 0;

/** Baut aus Entwurf + MHD-Liste ein Produkt für den lokalen State. */
export function buildProduct(draft: ProductDraft, dates: string[]): Product {
  draftCounter += 1;
  const id = `d5-new-${draftCounter}`;
  return { ...draft, id, location: "Neu erfasst", units: dates.map((mhd, i) => ({ id: `${id}-${i}`, mhd })) };
}

export function totalKcal(draft: ProductDraft, count: number): number {
  return Math.round((count * draft.contentPerUnit * draft.kcalPer100) / 100);
}

/** Letzter Tag eines Monats als ISO-Datum (MHD-Angaben „09/2027“). */
export function endOfMonthIso(year: number, month: number): string {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

/** Fasst MHDs zu „09/2027 (6×)“-Gruppen zusammen. */
export function groupByMonth(dates: string[]): string {
  const groups = new Map<string, number>();
  for (const mhd of dates) {
    const key = `${mhd.slice(5, 7)}/${mhd.slice(0, 4)}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }
  return [...groups].map(([month, n]) => `${month} (${n}×)`).join(", ");
}
