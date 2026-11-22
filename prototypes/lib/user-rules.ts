import type { AppUser, Role, Session } from "./settings-types";

/** Reine Regeln der Nutzerverwaltung. Grundregel: Es bleibt immer mindestens ein aktiver Admin. */

function isActiveAdmin(user: AppUser): boolean {
  return user.active && user.role === "admin";
}

export function isLastAdmin(users: AppUser[], userId: string): boolean {
  const admins = users.filter(isActiveAdmin);
  return admins.length === 1 && admins[0].id === userId;
}

export function patchUser(users: AppUser[], userId: string, patch: Partial<AppUser>): AppUser[] {
  return users.map((u) => (u.id === userId ? { ...u, ...patch } : u));
}

/** Der letzte Admin kann nicht herabgestuft werden. */
export function changeRole(users: AppUser[], userId: string, role: Role): AppUser[] {
  if (role !== "admin" && isLastAdmin(users, userId)) return users;
  return patchUser(users, userId, { role });
}

/** Der letzte Admin kann nicht deaktiviert werden. */
export function setUserActive(users: AppUser[], userId: string, active: boolean): AppUser[] {
  if (!active && isLastAdmin(users, userId)) return users;
  return patchUser(users, userId, { active, sessions: active ? findUser(users, userId)?.sessions ?? [] : [] });
}

export function removeUser(users: AppUser[], userId: string): AppUser[] {
  if (isLastAdmin(users, userId)) return users;
  return users.filter((u) => u.id !== userId);
}

/** Ein Mitglied gehört höchstens zu einem Nutzer: eine neue Verknüpfung löst die alte. */
export function linkMember(users: AppUser[], userId: string, memberId: string | null): AppUser[] {
  return users.map((u) => {
    if (u.id === userId) return { ...u, memberId };
    if (memberId !== null && u.memberId === memberId) return { ...u, memberId: null };
    return u;
  });
}

function patchSessions(users: AppUser[], userId: string, update: (sessions: Session[]) => Session[]): AppUser[] {
  return users.map((u) => (u.id === userId ? { ...u, sessions: update(u.sessions) } : u));
}

export function endSession(users: AppUser[], userId: string, sessionId: string): AppUser[] {
  return patchSessions(users, userId, (sessions) => sessions.filter((s) => s.id !== sessionId));
}

export function setSessionPush(users: AppUser[], userId: string, sessionId: string, push: boolean): AppUser[] {
  return patchSessions(users, userId, (sessions) => sessions.map((s) => (s.id === sessionId ? { ...s, push } : s)));
}

export interface InviteDraft {
  name: string;
  email: string;
  role: Role;
  memberId: string | null;
}

/** Legt einen eingeladenen Nutzer an; er wird aktiv, sobald er den Einladungslink öffnet. */
export function inviteUser(users: AppUser[], draft: InviteDraft, id: string): AppUser[] {
  const invited: AppUser = { id, ...draft, memberId: null, active: true, invited: true, lastLogin: null, sessions: [] };
  return linkMember([...users, invited], id, draft.memberId);
}

export function findUser(users: AppUser[], userId: string): AppUser | undefined {
  return users.find((u) => u.id === userId);
}
