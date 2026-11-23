// Schemas der Anmeldung (EINSTELLUNGEN_NUTZER §4.4). Das Benutzername-Muster teilen DB-CHECK,
// dieses Schema und der Validator des Username-Plugins (#133).
import { z } from 'zod'
import {
  CHECK_IN_CADENCES,
  USER_ROLES,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_PATTERN_SOURCE,
} from '@/shared/config/constants'

const USERNAME_PATTERN = new RegExp(USERNAME_PATTERN_SOURCE)
const DISPLAY_NAME_MAX_LENGTH = 60

export const usernameSchema = z.string().trim().toLowerCase().regex(USERNAME_PATTERN, {
  error: 'Der Benutzername hat 3 bis 30 Zeichen: Buchstaben, Ziffern, Punkt oder Unterstrich.',
})

// Beim Anmelden wird das Muster bewusst nicht geprüft: Jeder eingegebene Name zählt für die
// Bremse, und die Antwort verrät nicht, ob es ihn geben könnte (EINSTELLUNGEN §4.3).
export const signInSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(USERNAME_MAX_LENGTH),
  password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  rememberMe: z.boolean(),
})

export type SignInInput = z.infer<typeof signInSchema>

// Leerzeichen gehören zum Passwort und werden nicht abgeschnitten (EINSTELLUNGEN §4.4).
const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { error: 'Bitte mindestens 10 Zeichen.' })
  .max(PASSWORD_MAX_LENGTH, { error: 'Bitte höchstens 128 Zeichen.' })

// Ersteinrichtung, Schritt „Willkommen und Konto“ (ONBOARDING §2.2): Anzeigename, Benutzername,
// Passwort. Was ein Passwort nicht enthalten darf, prüft domain/password-rules.ts, weil Schemas
// keine Fachlogik importieren.
const displayNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'Bitte einen Namen eintragen.' })
  .max(DISPLAY_NAME_MAX_LENGTH, { error: 'Bitte höchstens 60 Zeichen.' })

export const setupSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  password: newPasswordSchema,
})

export type SetupInput = z.infer<typeof setupSchema>

export const userIdSchema = z.uuid()

export const roleSchema = z.enum(USER_ROLES, { error: 'Bitte eine Rolle wählen.' })

// Leer heißt „keine Person“
export const linkedMemberSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  z.uuid({ error: 'Diese Person gibt es nicht mehr.' }).nullable(),
)

// Leer heißt: Preposaurus erzeugt das Passwort (EINSTELLUNGEN_NUTZER §3.1).
export const chosenPasswordSchema = z.preprocess(
  (value) => (value === '' ? null : value),
  newPasswordSchema.nullable(),
)

// Nutzer anlegen durch den Admin (#123): Anzeigename, Benutzername, Rolle, optional Person und Passwort
export const createUserSchema = z.object({
  displayName: displayNameSchema,
  username: usernameSchema,
  role: roleSchema,
  memberId: linkedMemberSchema,
  password: chosenPasswordSchema,
})

export type CreateUserInput = z.infer<typeof createUserSchema>

const EMAIL_MAX_LENGTH = 254

// Freiwillige Adresse für Erinnerungen (#75). Leer heißt: keine Mails.
const reminderEmailSchema = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value
    const address = value.trim().toLowerCase()
    return address === '' ? null : address
  },
  z
    .email({ error: 'Bitte eine E-Mail-Adresse wie name@beispiel.de eintragen.' })
    .max(EMAIL_MAX_LENGTH, { error: 'Diese Adresse ist zu lang.' })
    .nullable(),
)

// Mein Konto (#75): Anzeigename und freiwillige Adresse für Erinnerungen
export const profileSchema = z.object({
  displayName: displayNameSchema,
  reminderEmail: reminderEmailSchema,
})

export type ProfileInput = z.infer<typeof profileSchema>

// Eigenes Passwort ändern (EINSTELLUNGEN_NUTZER §3.2): das alte ist Pflicht, das neue folgt §4.4.
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { error: 'Bitte das bisherige Passwort eintragen.' })
    .max(PASSWORD_MAX_LENGTH, { error: 'Das bisherige Passwort stimmt nicht.' }),
  newPassword: newPasswordSchema,
  endOtherSessions: z.boolean(),
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Check-in-Mail je Nutzer (ERI-06, #89): aus, wöchentlich oder monatlich
export const checkInChoiceSchema = z.enum(['aus', ...CHECK_IN_CADENCES], {
  error: 'Bitte wählen, wie oft die Check-in-Mail kommt.',
})

export type CheckInChoice = z.infer<typeof checkInChoiceSchema>
