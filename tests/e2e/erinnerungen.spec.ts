import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { waitForHydration } from '../helpers/hydration'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Erinnerungen des Haushalts (#89): Wochenübersicht mit Tag und Uhrzeit und „Dringend“. Alle
// Projekte teilen sich einen Haushalt, deshalb ändert nur „desktop“ die Werte und stellt sie
// danach zurück. Push hat noch keinen Schalter (#86), nur einen ruhigen Hinweis.

const PATH = '/einstellungen/erinnerungen'
const areaList = (page: Page) => page.getByRole('region', { name: 'Bereiche der Einstellungen' })
const form = (page: Page) => page.getByRole('form', { name: 'Erinnerungen' })

async function chooseSchedule(page: Page, schedule: { weekday: string; time: string }) {
  await form(page).getByText(schedule.weekday, { exact: true }).click()
  await form(page).getByLabel('Uhrzeit').fill(schedule.time)
}

// Der Schalter ist eine versteckte Checkbox, getippt wird auf seine Beschriftung. „Dringend“ heißt
// auch der Gruppenkopf, deshalb über das label.
async function toggleUrgent(page: Page) {
  await form(page).locator('label').filter({ hasText: 'Dringend' }).click()
}

async function save(page: Page) {
  await form(page).getByRole('button', { name: 'Speichern' }).click()
  await expect(form(page).getByText('Gespeichert.')).toBeVisible()
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Erinnerungen sind in jeder Stufe barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto(PATH)
    await expect(page.getByRole('heading', { level: 1, name: 'Erinnerungen' })).toBeVisible()
    await expect(page.getByRole('switch', { name: 'Wochenübersicht' })).toHaveCount(1)
    await expect(page.getByRole('switch', { name: /Push/ })).toHaveCount(0)
    await expect(page.getByRole('list', { name: 'Zustellung' })).toContainText('kommt später')
    await expectAccessibleLayout(page)
  })
}

test('Admin stellt Tag, Uhrzeit und „Dringend“ um, die Liste zeigt den neuen Wert', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Ändert den ganzen Haushalt, läuft nur auf Desktop')
  await page.goto('/einstellungen')
  const row = areaList(page).getByRole('link', { name: /Erinnerungen/ })
  await expect(row).toContainText('Samstag, 10:00 Uhr')
  await row.click()
  await expect(page).toHaveURL(new RegExp(`${PATH}$`))
  await waitForHydration(page)

  await chooseSchedule(page, { weekday: 'Dienstag', time: '18:30' })
  await toggleUrgent(page)
  await save(page)
  await expect(row).toContainText('Dienstag, 18:30 Uhr')
  await expect(row).toHaveAttribute('aria-current', 'page')

  await page.reload()
  await expect(page.getByRole('radio', { name: 'Dienstag' })).toBeChecked()
  await expect(form(page).getByLabel('Uhrzeit')).toHaveValue('18:30')
  await expect(page.getByRole('switch', { name: 'Dringend' })).not.toBeChecked()
  await expectAccessibleLayout(page)

  await waitForHydration(page)
  await chooseSchedule(page, { weekday: 'Samstag', time: '10:00' })
  await toggleUrgent(page)
  await save(page)
  await expect(row).toContainText('Samstag, 10:00 Uhr')
  await expect(page.getByRole('switch', { name: 'Dringend' })).toBeChecked()
})

test.describe('als Mitglied', () => {
  test.use(signedOut)

  test('sieht die Erinnerungen nur lesend', async ({ page }) => {
    await signInViaUi(page, E2E_MEMBER)
    await page.goto(PATH)

    await expect(page.getByRole('list', { name: 'Wochenübersicht' })).toBeVisible()
    await expect(page.getByRole('list', { name: 'Dringend' })).toBeVisible()
    await expect(page.getByRole('switch')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Speichern' })).toHaveCount(0)
    await expect(page.getByText('Das ändert ein Admin.')).toBeVisible()
    await expectAccessibleLayout(page)
  })
})
