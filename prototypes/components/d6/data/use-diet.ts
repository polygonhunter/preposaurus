"use client";

import { useRef, useState } from "react";
import { newMemberProfile, withProfileDefaults } from "@/lib/mock-settings";
import type { MemberProfile } from "@/lib/settings-types";
import type { Diet, Member } from "@/lib/types";

/** Lokaler State des Haushalts: Mitglieder (inkl. eigener Ernährungsform) und Haushalts-Standard. */
export function useDiet(baseMembers: Member[], baseDiet: Diet) {
  const [householdDiet, setHouseholdDiet] = useState<Diet>(baseDiet);
  const [members, setMembers] = useState<MemberProfile[]>(() => withProfileDefaults(baseMembers));
  const nextId = useRef(1);

  /** `diet: undefined` = Mitglied folgt wieder dem Haushalts-Standard. */
  const updateMember = (memberId: string, patch: Partial<MemberProfile>) =>
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));

  /** Legt ein Mitglied an und liefert dessen ID (zum direkten Bearbeiten). */
  const addMember = (): string => {
    const id = `neu-${nextId.current++}`;
    setMembers((prev) => [...prev, newMemberProfile(id)]);
    return id;
  };

  const removeMember = (memberId: string) => setMembers((prev) => prev.filter((m) => m.id !== memberId));

  return { householdDiet, setHouseholdDiet, members, updateMember, addMember, removeMember };
}

export type DietState = ReturnType<typeof useDiet>;
