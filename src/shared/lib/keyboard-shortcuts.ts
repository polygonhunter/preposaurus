// Tastenkürzel am PC (DESIGN_SYSTEM §6): „/“ springt in die Suche, „n“ öffnet Erfassen. Wer gerade
// tippt oder eine Taste mit Strg, Alt oder Befehl drückt, bekommt nie ein Kürzel.

export type ShortcutAction = 'search' | 'capture'

/** Taste je Kürzel, auch für `aria-keyshortcuts` und das sichtbare `kbd` */
export const SHORTCUT_KEYS: Readonly<Record<ShortcutAction, string>> = {
  search: '/',
  capture: 'n',
}

// WCAG 2.1.4 (#254): Ein-Zeichen-Kürzel lassen sich abschalten. Die Wahl gilt je Browser und steht in
// einem Cookie, damit schon der Server ohne Kürzel rendert (kein `kbd`, kein `aria-keyshortcuts`).
export const SHORTCUTS_COOKIE = 'preposaurus-kuerzel'
export const SHORTCUTS_OFF = 'aus'

/** Kürzel sind an, solange das Cookie nicht ausdrücklich „aus“ sagt. */
export const areShortcutsEnabled = (cookieValue: string | undefined): boolean =>
  cookieValue !== SHORTCUTS_OFF

type KeyInput = Readonly<{
  key: string
  altKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  isComposing: boolean
  defaultPrevented: boolean
}>

type TargetInput = Readonly<{ tagName: string; isContentEditable: boolean }> | null

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function isTypingTarget(target: TargetInput): boolean {
  return target !== null && (TYPING_TAGS.has(target.tagName) || target.isContentEditable)
}

function hasCommandModifier(event: KeyInput): boolean {
  return event.altKey || event.ctrlKey || event.metaKey
}

/** Das Kürzel zu einem Tastendruck oder null. Shift bleibt erlaubt („/“ ist auf deutscher Tastatur Shift+7). */
export function shortcutFor(event: KeyInput, target: TargetInput): ShortcutAction | null {
  if (event.defaultPrevented || event.isComposing || hasCommandModifier(event)) return null
  if (isTypingTarget(target)) return null
  if (event.key === SHORTCUT_KEYS.search) return 'search'
  if (event.key.toLowerCase() === SHORTCUT_KEYS.capture) return 'capture'
  return null
}
