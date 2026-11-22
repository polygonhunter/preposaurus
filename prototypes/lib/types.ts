export type CategoryKey =
  | "getreide"
  | "gemuese_huelsenfruechte"
  | "obst_nuesse"
  | "milch"
  | "fleisch_fisch_eier"
  | "fette_oele"
  | "wasser"
  | "getraenke"
  | "fertiggerichte"
  | "sonstiges";

export type Container = "dose" | "glas" | "packung" | "flasche" | "tetrapak" | "beutel";

export type Unit = "g" | "ml";

export type Ampel = "gruen" | "gelb" | "orange" | "rot";

export type Diet = "alles" | "vegetarisch" | "vegan";

/** Makronährstoffe je 100 g/ml. Fehlt der Wert, wird er nach Kategorie geschätzt. */
export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface Category {
  key: CategoryKey;
  label: string;
  emoji: string;
  /** Empfehlung pro Person für 10 Tage (BLE), in g bzw. ml */
  targetPerPerson10Days: number;
  unit: Unit;
}

export interface StockUnit {
  id: string;
  mhd: string; // ISO-Datum
}

export interface Product {
  id: string;
  name: string;
  category: CategoryKey;
  container: Container;
  contentPerUnit: number;
  unit: Unit;
  kcalPer100: number;
  macrosPer100?: Macros;
  location: string;
  units: StockUnit[];
}

export interface Member {
  id: string;
  name: string;
  kind: "erwachsen" | "kind" | "senior" | "baby";
  emoji: string;
  birthYear: number;
  /** Fehlt der Wert, gilt die Ernährungsform des Haushalts. */
  diet?: Diet;
}

export interface Goal {
  days: number;
  targetDate: string;
}

export interface CheckIn {
  date: string;
  done: boolean;
}

export interface RestockItem {
  id: string;
  label: string;
  amount: string;
  done: boolean;
}
