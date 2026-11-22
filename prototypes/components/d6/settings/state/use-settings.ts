"use client";

import { useState } from "react";
import { DEFAULT_AI, DEFAULT_MASTER_DATA, DEFAULT_NOTIFICATIONS } from "@/lib/mock-settings";
import { DEMO_USER_BY_ROLE, USERS } from "@/lib/mock-users";
import type { AppUser, Role } from "@/lib/settings-types";
import { findUser } from "@/lib/user-rules";
import type { TabKey } from "../../data/tabs";
import { usePatch } from "../../data/use-patch";

interface AppearanceSettings {
  reduceMotion: boolean;
  startView: TabKey;
}

const DEFAULT_APPEARANCE: AppearanceSettings = { reduceMotion: false, startView: "uebersicht" };

/** Lokaler State aller Einstellungen, die nicht in die Vorrats-Berechnung eingehen. */
export function useSettings() {
  const [viewAs, setViewAs] = useState<Role>("admin");
  const [users, setUsers] = useState<AppUser[]>(USERS);
  const [notifications, patchNotifications] = usePatch(DEFAULT_NOTIFICATIONS);
  const [appearance, patchAppearance] = usePatch(DEFAULT_APPEARANCE);
  const [ai, patchAi] = usePatch(DEFAULT_AI);
  const [masterData, patchMasterData] = usePatch(DEFAULT_MASTER_DATA);
  const currentUser = findUser(users, DEMO_USER_BY_ROLE[viewAs]);

  return {
    viewAs,
    setViewAs,
    users,
    /** Nutzer-Änderungen laufen über die reinen Regeln aus lib/user-rules.ts. */
    updateUsers: (change: (users: AppUser[]) => AppUser[]) => setUsers(change),
    currentUser,
    notifications,
    patchNotifications,
    appearance,
    patchAppearance,
    ai,
    patchAi,
    masterData,
    patchMasterData,
  };
}

export type SettingsState = ReturnType<typeof useSettings>;
