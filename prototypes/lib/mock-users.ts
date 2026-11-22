import type { AppUser } from "./settings-types";

/** Demo-Nutzer: Alex (Admin) ↔ Mitglied Alex, Sam (Mitglied) ↔ Mitglied Sam. Kim hat keinen Login. */
export const USERS: AppUser[] = [
  {
    id: "u1",
    name: "Alex",
    email: "alex@example.org",
    role: "admin",
    active: true,
    invited: false,
    memberId: "m1",
    lastLogin: "2026-10-08T07:42:00",
    sessions: [
      { id: "s1", device: "iPhone · Safari (Home-Bildschirm)", lastActive: "2026-10-08T07:42:00", current: true, push: true },
      { id: "s2", device: "MacBook · Firefox", lastActive: "2026-10-07T21:10:00", current: false, push: false },
    ],
  },
  {
    id: "u2",
    name: "Sam",
    email: "sam@example.org",
    role: "mitglied",
    active: true,
    invited: false,
    memberId: "m2",
    lastLogin: "2026-10-06T19:03:00",
    sessions: [{ id: "s3", device: "Pixel · Chrome", lastActive: "2026-10-06T19:03:00", current: true, push: true }],
  },
];

/** Wer im Prototyp „angemeldet“ ist, je nach Demo-Ansicht. */
export const DEMO_USER_BY_ROLE = { admin: "u1", mitglied: "u2" } as const;
