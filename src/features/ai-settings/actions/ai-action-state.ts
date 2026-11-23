// Zustand der Actions auf der Seite „Foto-Erkennung“ (#108). Ohne server-only, weil die Formulare
// den Anfangszustand brauchen. Kein Zustand enthält je den Schlüssel.

type AiFormField = 'name' | 'apiKey'

export type AiActionState = Readonly<{
  status: 'idle' | 'saved' | 'error'
  message: string | null
  errors?: Partial<Record<AiFormField, string>>
  /** nur der Name, damit das Formular nach einem Fehler nichts verliert. Nie der Schlüssel. */
  name?: string
}>

export const AI_ACTION_IDLE: AiActionState = { status: 'idle', message: null }

export const CONNECTION_GONE = 'Diese Verbindung gibt es nicht mehr. Bitte lade die Seite neu.'

export const failed = (message: string): AiActionState => ({ status: 'error', message })

export const saved = (message: string): AiActionState => ({ status: 'saved', message })
