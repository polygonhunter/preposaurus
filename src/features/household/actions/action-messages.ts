// Gemeinsame Sätze und Zustände der Haushalts-Actions (#38, #117).

export const MEMBER_GONE = 'Diese Person gibt es nicht mehr. Bitte lade die Seite neu.'

/** Antwort einfacher Formulare mit einer Einstellung */
export type SettingState = Readonly<{ status: 'idle' | 'saved' | 'error'; message: string | null }>

export const SETTING_IDLE: SettingState = { status: 'idle', message: null }
