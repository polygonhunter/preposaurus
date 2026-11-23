// Was „Mein Konto“ über den angemeldeten Nutzer zeigt (#75, #89). Liegt in domain/, weil die
// Oberfläche Typen nur von hier lesen darf. Kein Hash, kein Sitzungs-Token, keine technische Adresse.

export type OwnProfile = Readonly<{
  displayName: string
  username: string
  reminderEmail: string | null
  householdName: string | null
  isPasswordTemporary: boolean
  passwordChangedAt: Date | null
  /** Anzeigename dessen, der das Passwort zuletzt gesetzt hat, null bei Kommandozeile oder nie */
  passwordChangedByName: string | null
  /** Rhythmus der Check-in-Mail, null heißt aus */
  checkInCadence: string | null
}>

export type ProfileView = OwnProfile & Readonly<{ isMailConfigured: boolean }>
