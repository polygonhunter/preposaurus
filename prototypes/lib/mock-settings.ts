import { DEFAULT_AMPEL_RULES } from "./ampel-rules";
import type {
  AiSettings,
  GoalSettings,
  HouseholdRules,
  MasterData,
  MemberProfile,
  NotificationSettings,
  RecommendationSource,
} from "./settings-types";
import type { Goal, Member } from "./types";

/** Empfehlungsquellen mit Stand und Link (research/07, research/08). */
export const SOURCES: RecommendationSource[] = [
  {
    id: "de-bbk-ble",
    label: "BBK/BLE (Deutschland)",
    publisher: "BBK-Ratgeber „Vorsorgen für Krisen und Katastrophen“ + BLE-Vorratstabelle",
    stand: "BBK 11/2025 · BLE-Tabelle 24.03.2023",
    url: "https://www.ernaehrungsvorsorge.de/private-vorsorge/notvorrat/vorratstabelle",
    available: true,
  },
  { id: "at", label: "Österreich", publisher: "Zivilschutzverband", stand: "vorbereitet", url: "", available: false },
  { id: "ch", label: "Schweiz", publisher: "BWL", stand: "vorbereitet", url: "", available: false },
];

export const BBK_URL =
  "https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/So-koennen-Sie-sich-vorbereiten/Bevorraten/bevorraten_node.html";

export const GOAL_DAY_PRESETS = [3, 10, 14];

/** Ziel aus den Dashboard-Daten plus Quelle, Rechenmodus und Zwischen-Etappen (das Ziel selbst ist die letzte). */
export function goalSettingsFrom(goal: Goal): GoalSettings {
  return { ...goal, sourceId: SOURCES[0].id, mode: "offiziell", milestones: [{ days: 3, date: "2026-10-31" }] };
}

export const DEFAULT_HOUSEHOLD_RULES: HouseholdRules = { ampel: DEFAULT_AMPEL_RULES, inventoryMonths: 3 };

export const INVENTORY_MONTH_OPTIONS = [1, 3, 6, 12];

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  weeklyDigest: true,
  digestDay: "sa",
  digestTime: "10:00",
  urgent: true,
  milestones: true,
  checkInMail: "woechentlich",
};

export const DEFAULT_AI: AiSettings = {
  enabled: true,
  models: { verpackung: "haiku-5.5", naehrwerte: "sonnet-5.5", mhd: "sonnet-5.5" },
};

/** Demo-Werte für die Kostenübersicht, keine echten Abrechnungsdaten. */
export const AI_COST_THIS_MONTH = { euro: 1.84, photos: 62 };

export const BACKUP_STATUS = { lastBackup: "2026-10-08T03:00:00", schedule: "täglich 03:00", target: "Volume /backups" };

export const APP_INFO = { version: "0.1.0-prototyp", license: "Open Source (Lizenz wird noch festgelegt)" };

export const THIRD_PARTY = [
  { name: "Lucide Icons", license: "ISC" },
  { name: "Open Food Facts (Produktdaten)", license: "ODbL" },
  { name: "GSAP", license: "Standard-Lizenz" },
];

export const DEFAULT_MASTER_DATA: MasterData = {
  categories: [
    { id: "c1", name: "Nudeln & Reis", emoji: "🍝", group: "getreide", hidden: false },
    { id: "c2", name: "Hülsenfrüchte", emoji: "🫘", group: "gemuese_huelsenfruechte", hidden: false },
    { id: "c3", name: "Gemüsekonserven", emoji: "🥫", group: "gemuese_huelsenfruechte", hidden: false },
    { id: "c4", name: "Obstkonserven", emoji: "🍑", group: "obst_nuesse", hidden: false },
    { id: "c5", name: "Nüsse", emoji: "🥜", group: "obst_nuesse", hidden: false },
    { id: "c6", name: "H-Milch", emoji: "🥛", group: "milch", hidden: false },
    { id: "c7", name: "Fisch in Dosen", emoji: "🐟", group: "fleisch_fisch_eier", hidden: false },
    { id: "c8", name: "Öle", emoji: "🫒", group: "fette_oele", hidden: false },
    { id: "c9", name: "Wasser", emoji: "💧", group: "wasser", hidden: false },
    { id: "c10", name: "Süßes", emoji: "🍯", group: "sonstiges", hidden: true },
  ],
  locations: ["Keller", "Küche", "Speisekammer"],
};

export const ALLERGY_OPTIONS = ["glutenfrei", "laktosefrei", "Nüsse", "Erdnüsse", "Ei", "Soja", "Fisch"];

export const MEMBER_EMOJIS = ["🧔", "👩", "👧", "👦", "🧒", "👶", "👵", "👴", "🧑"];

/** Zusatzangaben der Demo-Mitglieder; alles Übrige bekommt Standardwerte. */
const PROFILE_EXTRAS: Record<string, Partial<MemberProfile>> = {
  m1: { sex: "divers" },
  m2: { sex: "weiblich", activity: "viel" },
  m3: { allergies: ["glutenfrei"] },
};

export function withProfileDefaults(members: Member[]): MemberProfile[] {
  return members.map((m) => ({ activity: "normal", condition: "keine", allergies: [], ...m, ...PROFILE_EXTRAS[m.id] }));
}

export function newMemberProfile(id: string): MemberProfile {
  return { id, name: "Neues Mitglied", kind: "erwachsen", emoji: "🧑", birthYear: 1990, activity: "normal", condition: "keine", allergies: [] };
}
