// Schemas der Anmeldung (EINSTELLUNGEN_NUTZER §4.4). Das Benutzername-Muster teilen DB-CHECK,
// dieses Schema und der Validator des Username-Plugins (#133).
import { z } from 'zod'
import {
  PASSWORD_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_PATTERN_SOURCE,
} from '@/shared/config/constants'

const USERNAME_PATTERN = new RegExp(USERNAME_PATTERN_SOURCE)

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
