import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Je nach Projekt ist das die Tab-Leiste (kompakt, mittel) oder die Seitenleiste (ab breit).
// Die jeweils andere ist ausgeblendet und damit nicht im Barrierefreiheitsbaum.
const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' })

test('/ leitet auf die Übersicht', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/uebersicht$/)
  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`unbekannte Adresse zeigt eine deutsche Seite mit Weg zurück (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme })
    const response = await page.goto('/gibtsnicht')

    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1, name: 'Nicht gefunden' })).toBeVisible()
    await expect(page.getByText('Diese Seite gibt es nicht.')).toBeVisible()
    await expectAccessibleLayout(page)
    await page.getByRole('link', { name: 'Zur Übersicht' }).click()
    await expect(page).toHaveURL(/\/uebersicht$/)
  })
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Rahmen ist barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/uebersicht')

    await expect(mainNav(page).getByRole('link', { name: 'Übersicht' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expectAccessibleLayout(page)
  })
}

test('Tabwechsel per Tippen bzw. Klicken', async ({ page, isMobile }) => {
  await page.goto('/uebersicht')
  const stock = mainNav(page).getByRole('link', { name: 'Vorrat' })

  await (isMobile ? stock.tap() : stock.click())

  await expect(page).toHaveURL(/\/vorrat$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible()
  await expect(stock).toHaveAttribute('aria-current', 'page')
  await expect(mainNav(page).getByRole('link', { name: 'Übersicht' })).not.toHaveAttribute(
    'aria-current',
  )
})

test('Tabwechsel per Tastatur', async ({ page, browserName }) => {
  await page.goto('/statistik')
  const restock = mainNav(page).getByRole('link', { name: 'Nachkaufen' })
  // WebKit erreicht Links per Tab nur mit einer Systemeinstellung, dort direkt fokussieren.
  if (browserName === 'webkit') {
    await restock.focus()
  } else {
    await mainNav(page).getByRole('link', { name: 'Statistik' }).focus()
    await page.keyboard.press('Shift+Tab')
  }
  await expect(restock).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL(/\/nachkaufen$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Nachkaufen' })).toBeVisible()
})

test('Erfassen ist erreichbar, auch wenn die Beschriftung nur für Screenreader da ist', async ({
  page,
}) => {
  await page.goto('/uebersicht')
  await mainNav(page).getByRole('link', { name: 'Erfassen' }).click()

  // /neu öffnet den zuletzt genutzten Weg oder fragt nach einem offenen Entwurf.
  await expect(page).toHaveURL(/\/neu(\/foto|\/manuell)?$/)
})

test('Einstellungen sind von der Übersicht aus erreichbar', async ({ page }) => {
  await page.goto('/uebersicht')
  await page.getByRole('main').getByRole('link', { name: 'Einstellungen' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible()
})

test('Sprunglink führt an der Navigation vorbei zum Inhalt', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit springt per Tab nur mit Systemeinstellung zu Links')
  await page.goto('/uebersicht')

  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Zum Inhalt springen' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
})
