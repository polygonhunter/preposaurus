import type { Page, TestInfo } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'

// Die Rückgängig-Zeile hält an, solange die Maus über ihr liegt oder sichtbarer Fokus in ihr steht
// (WCAG 2.2.1, #272). Danach beginnen die fünf Sekunden neu. Auf der Musterseite, mit eigener Uhr:
// Sie ändert keine Daten, und die Zeit läuft nur, wenn der Test sie vorstellt.

const MESSAGE = '1 Haferflocken entnommen'

async function openDemo(page: Page, info: TestInfo) {
  test.skip(info.project.name !== 'desktop', 'einmal reicht')
  await page.clock.install()
  await page.goto('/muster')
  const light = page.getByRole('region', { name: 'Hell' })
  return {
    show: light.getByRole('button', { name: '1 entnehmen' }),
    bar: light.getByRole('group', { name: MESSAGE }),
  }
}

test('Maus über der Zeile hält die Zeit an, danach fünf Sekunden neu', async ({ page }, info) => {
  const { show, bar } = await openDemo(page, info)
  await show.click()
  await bar.hover()
  await page.clock.runFor(10_000)
  await expect(bar).toBeVisible()

  await page.mouse.move(5, 5)
  await page.clock.runFor(4_000)
  await expect(bar).toBeVisible()
  await page.clock.runFor(1_500)
  await expect(bar).toHaveCount(0)
})

test('Fokus per Tastatur hält die Zeit an, auch nach dem Hinausgehen läuft sie neu', async ({
  page,
}, info) => {
  const { show, bar } = await openDemo(page, info)
  await show.press('Enter')
  await bar.getByRole('button', { name: 'Rückgängig' }).focus()
  await page.clock.runFor(10_000)
  await expect(bar).toBeVisible()

  await show.focus()
  await page.clock.runFor(4_000)
  await expect(bar).toBeVisible()
  await page.clock.runFor(1_500)
  await expect(bar).toHaveCount(0)
})

// Verschwindet der fokussierte Knopf (wie „Nachkaufen“ nach dem Tipp), kommt kein blur, und
// useFocusRescue führt den Fokus hinaus. Die Zeile darf dann nicht für immer stehen bleiben.
test('Verschwindet der fokussierte Knopf, läuft die Zeit trotzdem ab', async ({ page }, info) => {
  const { show, bar } = await openDemo(page, info)
  await show.press('Enter')
  const secondary = bar.getByRole('button', { name: 'Auf Einkaufsliste' })
  await secondary.focus()
  await secondary.evaluate((button) => {
    button.remove()
  })
  await show.focus()
  await page.clock.runFor(5_500)
  await expect(bar).toHaveCount(0)
})
