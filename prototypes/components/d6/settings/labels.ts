import { DIET_LABELS } from "@/lib/diet";
import type {
  Activity,
  AiModel,
  CalcMode,
  CheckInMailFrequency,
  Condition,
  PhotoKind,
  Role,
  Sex,
  Weekday,
} from "@/lib/settings-types";
import type { Diet, Member } from "@/lib/types";
import { capitalize } from "../data/format";

/** Alle deutschen Beschriftungen der Einstellungen an einer Stelle. */
export const ROLE_LABELS: Record<Role, string> = { admin: "Admin", mitglied: "Mitglied" };

export const KIND_LABELS: Record<Member["kind"], string> = {
  erwachsen: "Erwachsen",
  kind: "Kind",
  senior: "Senior:in",
  baby: "Baby",
};

export const SEX_LABELS: Record<Sex, string> = { weiblich: "weiblich", maennlich: "männlich", divers: "divers" };

export const ACTIVITY_LABELS: Record<Activity, string> = { wenig: "wenig", normal: "normal", viel: "viel" };

export const CONDITION_LABELS: Record<Condition, string> = { keine: "nein", schwanger: "schwanger", stillend: "stillend" };

export const CALC_MODE_LABELS: Record<CalcMode, string> = { offiziell: "Offiziell", individuell: "Individuell" };

export const CHECK_IN_LABELS: Record<CheckInMailFrequency, string> = {
  woechentlich: "Wöchentlich",
  monatlich: "Monatlich",
  aus: "Aus",
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mo: "Montag",
  di: "Dienstag",
  mi: "Mittwoch",
  do: "Donnerstag",
  fr: "Freitag",
  sa: "Samstag",
  so: "Sonntag",
};

export const MODEL_LABELS: Record<AiModel, string> = { "sonnet-5.5": "Sonnet 5.5 (genauer)", "haiku-5.5": "Haiku 5.5 (günstiger)" };

export const PHOTO_KIND_LABELS: Record<PhotoKind, string> = { verpackung: "Verpackung", naehrwerte: "Nährwerte", mhd: "MHD" };

/** Optionen für Select/SegmentedControl aus einer Beschriftungs-Tabelle. */
export function optionsFrom<T extends string>(labels: Record<T, string>): { key: T; label: string }[] {
  return (Object.keys(labels) as T[]).map((key) => ({ key, label: labels[key] }));
}

export function dietLabel(diet: Diet): string {
  return capitalize(DIET_LABELS[diet]);
}

/** „vegetarisch“ bzw. „alles (wie Haushalt)“ */
export function memberDietText(member: Member, householdDiet: Diet): string {
  return member.diet ? DIET_LABELS[member.diet] : `${DIET_LABELS[householdDiet]} (wie Haushalt)`;
}

/** „08.10., 07:42“ */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
