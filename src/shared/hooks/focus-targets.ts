// Ziele für den Fokus, wenn der fokussierte Knopf verschwindet (#269, WAI-ARIA APG „Developing a
// Keyboard Interface“: Fokus nie auf body fallen lassen). Reine DOM-Helfer ohne React.
// Markup: Zeilen tragen data-focus-row mit einem stabilen Schlüssel, Listen ein aria-labelledby auf
// ihre Überschrift, Leisten unten (Rückgängig, Fehler) data-focus-return.

const ROW = '[data-focus-row]'
const RETURN_ZONE = '[data-focus-return]'
const LABELLED_LIST = 'ul[aria-labelledby]'
const CONTROL = 'a[href], button, input, select, textarea, [tabindex]'
const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

/** Ein mögliches Ziel; erst beim Retten ausgewertet, weil sich die Seite bis dahin ändert. */
export type FocusCandidate = () => HTMLElement | null

/** Die Zeile und der Knopf der letzten Handlung, damit „Rückgängig“ dorthin zurückfindet. */
export interface ActedControl {
  readonly origin: HTMLElement
  readonly rowKey: string | null
  readonly label: string
}

const labelOf = (element: Element) =>
  (element.getAttribute('aria-label') ?? element.textContent).trim()

const isUsable = (element: HTMLElement) => element.closest('dialog:not([open])') === null

/** Bedienelement in der Zeile, bevorzugt eines mit demselben Namen wie der alte Knopf. */
function controlIn(row: Element | null, label: string | null): HTMLElement | null {
  if (!row?.isConnected) return null
  const controls = [...row.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isUsable)
  return controls.find((control) => labelOf(control) === label) ?? controls[0] ?? null
}

function rowByKey(scope: Element | null, key: string | null): Element | null {
  if (scope === null || !scope.isConnected || key === null) return null
  return scope.querySelector(`${ROW}[data-focus-row="${CSS.escape(key)}"]`)
}

function headingOf(list: Element): HTMLElement | null {
  const id = list.getAttribute('aria-labelledby')
  return id === null ? null : document.getElementById(id)
}

/** Überschrift der eigenen Liste, dann die davor (nächste zuerst), dann die danach. */
function headingsAround(list: Element | null, container: HTMLElement): HTMLElement[] {
  const lists = [...container.querySelectorAll(LABELLED_LIST)]
  const index = list === null ? -1 : lists.indexOf(list)
  const ordered =
    index === -1
      ? lists
      : [lists[index], ...lists.slice(0, index).reverse(), ...lists.slice(index + 1)]
  return ordered.flatMap((element) => {
    const heading = element === undefined ? null : headingOf(element)
    return heading === null ? [] : [heading]
  })
}

/** Ziele für einen Knopf in einer Zeile: er selbst, dieselbe Zeile neu geladen, Nachbarn, Überschrift. */
function rowCandidates(origin: HTMLElement, row: HTMLElement, container: HTMLElement) {
  const list = row.parentElement
  const key = row.getAttribute('data-focus-row')
  const label = labelOf(origin)
  const next = row.nextElementSibling
  const previous = row.previousElementSibling
  const headings = headingsAround(list, container)
  return [
    () => origin,
    () => controlIn(rowByKey(list, key), label),
    () => controlIn(next, null),
    () => controlIn(previous, null),
    ...headings.map((heading) => () => heading),
  ] satisfies FocusCandidate[]
}

/** Ziele für einen Knopf in einer Leiste: die Stelle der letzten Handlung, sonst die letzte Zeile. */
function returnCandidates(
  origin: HTMLElement,
  container: HTMLElement,
  { acted, lastRow }: FocusContext,
): FocusCandidate[] {
  if (acted === null) return [() => origin, ...lastRow]
  return [
    () => origin,
    () => acted.origin,
    () => controlIn(rowByKey(container, acted.rowKey), acted.label),
    ...lastRow,
  ]
}

export type FocusContext = Readonly<{
  acted: ActedControl | null
  /** Ziele der zuletzt fokussierten Zeile */
  lastRow: readonly FocusCandidate[]
}>

/** Ziele für das eben fokussierte Element, oder null, wenn es nicht zu Zeile oder Leiste gehört. */
export function candidatesFor(
  target: HTMLElement,
  container: HTMLElement,
  context: FocusContext,
): Readonly<{ candidates: FocusCandidate[]; isRow: boolean }> | null {
  // Ein Link führt auf eine andere Seite, die ihren Fokus selbst setzt
  if (target.matches('a[href]')) return null
  const row = target.closest<HTMLElement>(ROW)
  if (row !== null && container.contains(row)) {
    return { candidates: rowCandidates(target, row, container), isRow: true }
  }
  if (target.closest(RETURN_ZONE) === null) return null
  return { candidates: returnCandidates(target, container, context), isRow: false }
}

/** Merkt sich Knopf und Zeile eines Klicks, für die Rückkehr nach „Rückgängig“. */
export function actedControl(target: EventTarget | null): ActedControl | null {
  if (!(target instanceof Element)) return null
  const origin = target.closest<HTMLElement>(CONTROL)
  if (origin === null) return null
  if (origin.closest(RETURN_ZONE) !== null) return null
  const row = origin.closest<HTMLElement>(ROW)
  return { origin, rowKey: row?.getAttribute('data-focus-row') ?? null, label: labelOf(origin) }
}

/** Ob ein Element noch fokussierbar wäre. Sonst ist der Fokus mit ihm verloren gegangen. */
export const canHoldFocus = (element: HTMLElement) =>
  element.isConnected && !element.matches(':disabled') && isUsable(element)

export const isFocusLost = () =>
  document.activeElement === null || document.activeElement === document.body

function tryFocus(element: HTMLElement | null): boolean {
  if (element === null || !canHoldFocus(element)) return false
  // Überschriften sind nur per Skript fokussierbar, nicht per Tab
  if (element.matches('h1, h2, h3') && !element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1')
  }
  element.focus()
  return document.activeElement === element
}

const pageHeading: FocusCandidate = () => document.querySelector<HTMLElement>('main h1')

/** Fokussiert das erste Ziel, das es noch gibt; zuletzt die Seitenüberschrift. */
export function focusFirst(candidates: readonly FocusCandidate[]): void {
  for (const candidate of [...candidates, pageHeading]) {
    if (tryFocus(candidate())) return
  }
}
