import type { AmpelRules } from "./ampel-rules";
import type { CategoryKey, Goal, Member } from "./types";

export type Role = "admin" | "mitglied";
export type Sex = "weiblich" | "maennlich" | "divers";
export type Activity = "wenig" | "normal" | "viel";
export type Condition = "keine" | "schwanger" | "stillend";
export type CalcMode = "offiziell" | "individuell";
export type CheckInMailFrequency = "woechentlich" | "monatlich" | "aus";
export type Weekday = "mo" | "di" | "mi" | "do" | "fr" | "sa" | "so";
export type AiModel = "sonnet-5.5" | "haiku-5.5";
export type PhotoKind = "verpackung" | "naehrwerte" | "mhd";

/** Haushaltsmitglied mit allen Feldern aus dem Konzept (02_HAUSHALT_ZIEL.md). */
export interface MemberProfile extends Member {
  /** fehlt = keine Angabe */
  sex?: Sex;
  activity: Activity;
  weightKg?: number;
  condition: Condition;
  allergies: string[];
}

export interface Session {
  id: string;
  device: string;
  /** ISO-Zeitpunkt */
  lastActive: string;
  current: boolean;
  push: boolean;
}

/** Login-Nutzer; optional mit einem Haushaltsmitglied verknüpft (Nutzer ≠ Mitglied). */
export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  invited: boolean;
  memberId: string | null;
  /** ISO-Zeitpunkt, `null` = noch nie angemeldet */
  lastLogin: string | null;
  sessions: Session[];
}

export interface NotificationSettings {
  weeklyDigest: boolean;
  digestDay: Weekday;
  digestTime: string;
  urgent: boolean;
  milestones: boolean;
  checkInMail: CheckInMailFrequency;
}

export interface RecommendationSource {
  id: string;
  label: string;
  publisher: string;
  stand: string;
  url: string;
  /** false = im Datenmodell vorbereitet, noch nicht wählbar */
  available: boolean;
}

interface Milestone {
  days: number;
  date: string;
}

export interface GoalSettings extends Goal {
  sourceId: string;
  mode: CalcMode;
  milestones: Milestone[];
}

export interface HouseholdRules {
  ampel: AmpelRules;
  inventoryMonths: number;
}

export interface AiSettings {
  enabled: boolean;
  models: Record<PhotoKind, AiModel>;
}

/** Eigene Kategorie des Haushalts, einer offiziellen Warengruppe zugeordnet. */
export interface UserCategory {
  id: string;
  name: string;
  emoji: string;
  group: CategoryKey;
  hidden: boolean;
}

export interface MasterData {
  categories: UserCategory[];
  locations: string[];
}
