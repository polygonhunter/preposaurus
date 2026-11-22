import {
  Bell,
  Camera,
  Database,
  Palette,
  Salad,
  ShieldAlert,
  Tags,
  Target,
  UserPlus,
  UserRound,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/settings-types";

export type SettingsPageKey =
  | "root"
  | "profil"
  | "benachrichtigungen"
  | "darstellung"
  | "mitglieder"
  | "mitglied"
  | "ernaehrung"
  | "ziel"
  | "stammdaten"
  | "ampel"
  | "foto-ki"
  | "nutzer"
  | "nutzer-detail"
  | "einladen"
  | "daten";

/** Eine Station im Einstellungs-Stapel; `param` = ID bei Detailseiten. */
export interface SettingsRoute {
  page: SettingsPageKey;
  param?: string;
}

/** alle = jeder Nutzer · admin-lesen = Mitglieder sehen nur · admin = für Mitglieder ausgeblendet */
type Access = "alle" | "admin-lesen" | "admin";

interface PageMeta {
  title: string;
  icon: LucideIcon;
  access: Access;
}

export const SETTINGS_PAGES: Record<SettingsPageKey, PageMeta> = {
  root: { title: "Einstellungen", icon: UserRound, access: "alle" },
  profil: { title: "Profil", icon: UserRound, access: "alle" },
  benachrichtigungen: { title: "Benachrichtigungen", icon: Bell, access: "alle" },
  darstellung: { title: "Darstellung", icon: Palette, access: "alle" },
  mitglieder: { title: "Mitglieder", icon: Users, access: "admin-lesen" },
  mitglied: { title: "Mitglied", icon: UserRound, access: "admin-lesen" },
  ernaehrung: { title: "Ernährung", icon: Salad, access: "admin-lesen" },
  ziel: { title: "Ziel & Empfehlung", icon: Target, access: "admin-lesen" },
  stammdaten: { title: "Vorrat-Stammdaten", icon: Tags, access: "admin-lesen" },
  ampel: { title: "Ampel & Regeln", icon: ShieldAlert, access: "admin-lesen" },
  "foto-ki": { title: "Foto-Erkennung", icon: Camera, access: "admin-lesen" },
  nutzer: { title: "Nutzer", icon: UsersRound, access: "admin" },
  "nutzer-detail": { title: "Nutzer", icon: UserRound, access: "admin" },
  einladen: { title: "Nutzer einladen", icon: UserPlus, access: "admin" },
  daten: { title: "Daten & System", icon: Database, access: "admin" },
};

interface SettingsGroupMeta {
  label: string;
  access: Access;
  pages: SettingsPageKey[];
}

/** Gruppierte Startliste der Einstellungen. */
export const SETTINGS_GROUPS: SettingsGroupMeta[] = [
  { label: "Mein Konto", access: "alle", pages: ["profil", "benachrichtigungen", "darstellung"] },
  { label: "Haushalt", access: "admin-lesen", pages: ["mitglieder", "ernaehrung", "ziel", "stammdaten", "ampel", "foto-ki"] },
  { label: "Nutzerverwaltung", access: "admin", pages: ["nutzer", "einladen"] },
  { label: "Daten & System", access: "admin", pages: ["daten"] },
];

/** Gruppe einer Seite für die Brotkrumen; Detailseiten erben die Gruppe ihrer Liste. */
export function groupOf(page: SettingsPageKey): string | null {
  const listPage: SettingsPageKey = page === "mitglied" ? "mitglieder" : page === "nutzer-detail" ? "nutzer" : page;
  return SETTINGS_GROUPS.find((g) => g.pages.includes(listPage))?.label ?? null;
}

export function canSee(access: Access, role: Role): boolean {
  return access !== "admin" || role === "admin";
}

export function isReadOnly(access: Access, role: Role): boolean {
  return access === "admin-lesen" && role !== "admin";
}

export function routeKey(route: SettingsRoute): string {
  return route.param ? `${route.page}:${route.param}` : route.page;
}
