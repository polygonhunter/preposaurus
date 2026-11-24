import type { Locator } from '@playwright/test'

// Name des Hakens in der Zeile nach der von `control`, sonst in der davor: dorthin führt
// useFocusRescue den Fokus, wenn die Zeile geht (#269). Parallele Tests ändern dieselben Listen
// (neue Einträge, Lücken nach Entnahmen), deshalb direkt vor der Handlung lesen statt fest annehmen.
export async function neighbourCheckboxName(control: Locator): Promise<string> {
  const name = await control.evaluate((element) => {
    const row = element.closest('[data-focus-row]')
    const neighbour = row?.nextElementSibling ?? row?.previousElementSibling
    return neighbour?.querySelector('[role="checkbox"]')?.getAttribute('aria-label') ?? null
  })
  if (name === null) throw new Error('Die Zeile braucht eine Nachbarzeile mit Haken')
  return name
}
