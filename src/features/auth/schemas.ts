// Schemas der Anmeldung (EINSTELLUNGEN_NUTZER §4.4). Das Benutzername-Muster teilen DB-CHECK,
// dieses Schema und der Validator des Username-Plugins (#133).
import { z } from 'zod'
import {
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
export const setupSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'Bitte einen Namen eintragen.' })
    .max(DISPLAY_NAME_MAX_LENGTH, { error: 'Bitte höchstens 60 Zeichen.' }),
  username: usernameSchema,
  password: newPasswordSchema,
})

export type SetupInput = z.infer<typeof setupSchema>
