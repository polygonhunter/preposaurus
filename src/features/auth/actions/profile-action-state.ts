// Zustand der Formulare auf „Mein Konto“ (#75). Ohne server-only, weil die Formulare den
// Anfangszustand brauchen. Ein Zustand enthält nie ein Passwort.

type ProfileField = 'displayName' | 'reminderEmail' | 'currentPassword' | 'newPassword'

export type ProfileActionState = Readonly<{
  status: 'idle' | 'saved' | 'error'
  message: string | null
  errors?: Partial<Record<ProfileField, string>>
}>

export const PROFILE_ACTION_IDLE: ProfileActionState = { status: 'idle', message: null }

export const SIGNED_OUT = 'Bitte melde dich erneut an.'
