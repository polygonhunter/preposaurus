import type { CheckIn, Diet, Goal, Member, Product, RestockItem, StockUnit } from "./types";

export const TODAY = "2026-10-07";

export const MEMBERS: Member[] = [
  { id: "m1", name: "Alex", kind: "erwachsen", emoji: "🧑", birthYear: 1984 },
  { id: "m2", name: "Sam", kind: "erwachsen", emoji: "👩", birthYear: 1987 },
  { id: "m3", name: "Kim", kind: "kind", emoji: "👦", birthYear: 2016, diet: "vegetarisch" },
];

export const HOUSEHOLD_DIET: Diet = "alles";

export const GOAL: Goal = { days: 10, targetDate: "2026-12-31" };

function units(prefix: string, dates: string[]): StockUnit[] {
  return dates.map((mhd, i) => ({ id: `${prefix}-${i}`, mhd }));
}

export const PRODUCTS: Product[] = [
  { id: "p1", macrosPer100: { protein: 13, carbs: 71, fat: 2 }, name: "Nudeln", category: "getreide", container: "packung", contentPerUnit: 500, unit: "g", kcalPer100: 359, location: "Keller",
    units: units("p1", ["2027-09-30", "2027-09-30", "2027-09-30", "2027-11-30", "2027-11-30", "2027-11-30"]) },
  { id: "p2", macrosPer100: { protein: 7, carbs: 78, fat: 0.6 }, name: "Reis", category: "getreide", container: "packung", contentPerUnit: 1000, unit: "g", kcalPer100: 350, location: "Keller",
    units: units("p2", ["2028-03-31", "2028-03-31"]) },
  { id: "p3", name: "Haferflocken", category: "getreide", container: "packung", contentPerUnit: 500, unit: "g", kcalPer100: 372, location: "Küche",
    units: units("p3", ["2026-11-20"]) },
  { id: "p4", macrosPer100: { protein: 6, carbs: 12, fat: 0.5 }, name: "Linsen", category: "gemuese_huelsenfruechte", container: "dose", contentPerUnit: 400, unit: "g", kcalPer100: 90, location: "Keller",
    units: units("p4", ["2028-06-30", "2028-06-30", "2028-06-30", "2028-06-30"]) },
  { id: "p5", macrosPer100: { protein: 2.5, carbs: 15, fat: 1 }, name: "Mais", category: "gemuese_huelsenfruechte", container: "dose", contentPerUnit: 285, unit: "g", kcalPer100: 80, location: "Keller",
    units: units("p5", ["2027-05-31", "2027-05-31", "2027-05-31"]) },
  { id: "p6", macrosPer100: { protein: 1.5, carbs: 5, fat: 0.2 }, name: "Passierte Tomaten", category: "gemuese_huelsenfruechte", container: "tetrapak", contentPerUnit: 500, unit: "g", kcalPer100: 32, location: "Küche",
    units: units("p6", ["2026-10-28", "2027-02-28"]) },
  { id: "p7", macrosPer100: { protein: 0.5, carbs: 15, fat: 0 }, name: "Pfirsiche", category: "obst_nuesse", container: "dose", contentPerUnit: 470, unit: "g", kcalPer100: 65, location: "Keller",
    units: units("p7", ["2027-08-31", "2027-08-31"]) },
  { id: "p8", macrosPer100: { protein: 15, carbs: 7, fat: 65 }, name: "Walnüsse", category: "obst_nuesse", container: "beutel", contentPerUnit: 200, unit: "g", kcalPer100: 654, location: "Küche",
    units: units("p8", ["2026-10-02"]) },
  { id: "p9", macrosPer100: { protein: 3.4, carbs: 4.8, fat: 3.5 }, name: "H-Milch", category: "milch", container: "tetrapak", contentPerUnit: 1000, unit: "ml", kcalPer100: 64, location: "Keller",
    units: units("p9", ["2026-11-15", "2026-11-15", "2026-12-20", "2027-01-15"]) },
  { id: "p10", macrosPer100: { protein: 24, carbs: 0, fat: 11 }, name: "Thunfisch in Öl", category: "fleisch_fisch_eier", container: "dose", contentPerUnit: 150, unit: "g", kcalPer100: 190, location: "Keller",
    units: units("p10", ["2026-10-14", "2029-12-31", "2029-12-31"]) },
  { id: "p11", macrosPer100: { protein: 0, carbs: 0, fat: 92 }, name: "Rapsöl", category: "fette_oele", container: "flasche", contentPerUnit: 750, unit: "ml", kcalPer100: 828, location: "Küche",
    units: units("p11", ["2027-04-30", "2027-06-30"]) },
  { id: "p12", macrosPer100: { protein: 0, carbs: 0, fat: 0 }, name: "Mineralwasser", category: "wasser", container: "flasche", contentPerUnit: 1500, unit: "ml", kcalPer100: 0, location: "Keller",
    units: units("p12", Array(18).fill("2027-10-31")) },
  { id: "p13", macrosPer100: { protein: 3, carbs: 14, fat: 2.5 }, name: "Ravioli", category: "fertiggerichte", container: "dose", contentPerUnit: 800, unit: "g", kcalPer100: 90, location: "Keller",
    units: units("p13", ["2028-01-31", "2028-01-31"]) },
  { id: "p14", macrosPer100: { protein: 0.3, carbs: 82, fat: 0 }, name: "Honig", category: "sonstiges", container: "glas", contentPerUnit: 500, unit: "g", kcalPer100: 304, location: "Küche",
    units: units("p14", ["2028-12-31"]) },
];

export const CHECK_INS: CheckIn[] = [
  { date: "2026-08-15", done: true },
  { date: "2026-08-22", done: true },
  { date: "2026-08-29", done: false },
  { date: "2026-09-05", done: true },
  { date: "2026-09-12", done: true },
  { date: "2026-09-19", done: true },
  { date: "2026-09-26", done: true },
  { date: "2026-10-03", done: true },
];

export const RESTOCK: RestockItem[] = [
  { id: "r1", label: "Mineralwasser", amount: "12 × 1,5 l", done: false },
  { id: "r2", label: "Fisch, Fleisch, Eier", amount: "≈ 2,5 kg", done: false },
  { id: "r3", label: "Milch & Milchprodukte", amount: "≈ 3 kg", done: false },
  { id: "r4", label: "Haferflocken", amount: "1 Packung", done: true },
];

export const WASTE_STATS = { consumedKg: 14.2, wastedKg: 0.4 };
