import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Installierbar und letzter Stand ohne Verbindung (M10, #81 bis #83). Der Service Worker läuft nur
// im Produktionsbuild (CI: Standalone-Server). Lokal gegen den Dev-Server laufen nur Manifest,
// Offline-Hinweis und Sperre; lokal mit Service Worker: CI=1 E2E_PORT=3111 npx playwright test pwa
const offlineNotice = (page: Page) =>
  page.getByRole('status').filter({ hasText: 'Ohne Verbindung' })

test.describe('Manifest und Icons', () => {
  test('liefert ein gültiges Manifest mit Icons aus', async ({ page, request }) => {
    const response = await request.get('/manifest.webmanifest')
    expect(response.status()).toBe(200)
    const manifest = (await response.json()) as {
      name: string
      lang: string
      display: string
      start_url: string
      icons: { src: string; sizes: string; purpose: string }[]
    }
    expect(manifest).toMatchObject({
      name: 'Preposaurus',
      lang: 'de',
      display: 'standalone',
      start_url: '/uebersicht',
    })
    expect(manifest.icons.map(({ sizes, purpose }) => `${sizes} ${purpose}`)).toEqual([
      '192x192 any',
      '512x512 any',
      '512x512 maskable',
    ])
    for (const icon of manifest.icons) {
      const image = await request.get(icon.src)
      expect(image.status(), icon.src).toBe(200)
      expect(image.headers()['content-type']).toBe('image/png')
    }

    await page.goto('/uebersicht')
    await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
      'href',
      '/manifest.webmanifest',
    )
    const appleIcon = page.locator('link[rel="apple-touch-icon"]')
    expect((await request.get((await appleIcon.getAttribute('href')) ?? '')).status()).toBe(200)
  })
})

test.describe('Ohne Verbindung', () => {
  test('zeigt den Stand, sperrt Entnehmen und Suchen und gibt beides danach frei', async ({
    page,
    context,
  }) => {
    await page.goto('/vorrat?suche=Haferflocken')
    const takeOne = page.getByRole('button', { name: /^1 Packung .+ entnehmen$/ }).first()
    await expect(takeOne).toBeEnabled()

    await context.setOffline(true)
    await expect(offlineNotice(page)).toContainText(
      /Ohne Verbindung – Stand von \d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}/,
    )
    await expect(takeOne).toBeDisabled()
    await expectAccessibleLayout(page)

    await page.getByRole('searchbox').fill('Linsen')
    await page.getByRole('searchbox').press('Enter')
    await expect(
      page.getByRole('alert').filter({ hasText: 'Ohne Verbindung geht das gerade nicht' }),
    ).toBeVisible()
    await expect(page).toHaveURL(/suche=Haferflocken/)

    await context.setOffline(false)
    await expect(offlineNotice(page)).toHaveCount(0)
    await expect(takeOne).toBeEnabled()
  })

  test('zeigt den Hinweis auf der Warengruppe, „−1“ sagt beim Tippen warum', async ({
    page,
    context,
  }) => {
    await page.goto('/vorrat/getreide')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Getreide und Kartoffeln' }),
    ).toBeVisible()
    const takeOne = page.getByRole('button', { name: /^1 Packung .+ entnehmen$/ }).first()
    await expect(takeOne).toBeEnabled()

    await context.setOffline(true)
    await expect(offlineNotice(page)).toContainText('Ohne Verbindung – Stand von')
    await expect(takeOne).toBeDisabled()
    // Gesperrt heißt nicht stumm: Ein Tipp sagt, warum es gerade nicht geht (#216)
    await takeOne.click({ force: true })
    await expect(
      page.getByRole('alert').filter({ hasText: 'Ohne Verbindung geht das gerade nicht' }),
    ).toBeVisible()
    await expectAccessibleLayout(page)

    await context.setOffline(false)
    await expect(offlineNotice(page)).toHaveCount(0)
  })

  test('zeigt den Hinweis auch auf der Übersicht', async ({ page, context }) => {
    await page.goto('/uebersicht')
    await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
    await context.setOffline(true)
    await expect(offlineNotice(page)).toContainText('Erfassen und Entnehmen gehen wieder')
    await context.setOffline(false)
  })
})

test.describe('Service Worker', () => {
  test.beforeEach(({ browserName }, testInfo) => {
    // productionServer setzt playwright.config.ts, wenn der Standalone-Server läuft.
    test.skip(testInfo.config.metadata['productionServer'] !== true, 'Nur im Produktionsbuild')
    // Nur Chromium wendet setOffline zuverlässig auch auf den Service Worker an.
    test.skip(browserName !== 'chromium', 'Offline-Emulation für Service Worker nur in Chromium')
  })

  async function waitForServiceWorker(page: Page): Promise<void> {
    await page.goto('/uebersicht')
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready
    })
    // Einmal neu laden, damit die Seite über den Service Worker kommt und im Cache landet.
    await page.reload()
    await expect
      .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
      .toBe(true)
  }

  test('ist registriert und zeigt Übersicht und Vorrat nach dem Neuladen ohne Netz', async ({
    page,
    context,
  }) => {
    await waitForServiceWorker(page)
    await page.goto('/vorrat')
    await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible()

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible()
    await expect(offlineNotice(page)).toBeVisible()

    await page.goto('/uebersicht')
    await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
    await expect(offlineNotice(page)).toBeVisible()
    await expectAccessibleLayout(page)

    await page.goto('/neu')
    await expect(page.getByRole('heading', { level: 1, name: 'Ohne Verbindung' })).toBeVisible()
    await context.setOffline(false)
  })

  test('speichert keine API-Antworten und löscht den Stand am Sitzungsende', async ({
    page,
    context,
  }) => {
    await waitForServiceWorker(page)
    const cachedUrls = () =>
      page.evaluate(async () => {
        const urls: string[] = []
        for (const name of await caches.keys()) {
          const cache = await caches.open(name)
          for (const request of await cache.keys()) urls.push(`${name} ${request.url}`)
        }
        return urls
      })
    expect((await cachedUrls()).some((entry) => entry.includes('seiten-'))).toBe(true)
    expect((await cachedUrls()).some((entry) => entry.includes('/api/'))).toBe(false)

    // Ohne Sitzungs-Cookie leitet die App zur Anmeldung (wie nach dem Abmelden). Die Sitzung in
    // der DB bleibt, damit parallel laufende Tests sie weiter nutzen können.
    await context.clearCookies()
    await page.goto('/uebersicht')
    await expect(page).toHaveURL(/\/anmelden/)
    await expect
      .poll(async () => (await cachedUrls()).filter((entry) => entry.includes('seiten-')))
      .toEqual([])
  })
})

test.describe('Hinweis „Zum Home-Bildschirm“', () => {
  const hint = (page: Page) => page.getByRole('region', { name: 'Als App auf den Home-Bildschirm' })

  test('erscheint nur im iPhone-Safari und bleibt nach dem Ausblenden weg', async ({
    page,
  }, testInfo) => {
    await page.goto('/uebersicht')
    await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
    if (testInfo.project.name !== 'iphone') {
      await expect(hint(page)).toHaveCount(0)
      return
    }
    await expect(hint(page)).toContainText('Zum Home-Bildschirm')
    await expectAccessibleLayout(page)

    await hint(page).getByRole('button', { name: 'Ausblenden' }).click()
    await expect(hint(page)).toHaveCount(0)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
    await expect(hint(page)).toHaveCount(0)
  })

  test('erscheint nicht in der installierten App', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'iphone', 'Nur im iPhone-Safari relevant')
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'standalone', { value: true })
    })
    await page.goto('/uebersicht')
    await expect(page.getByRole('heading', { level: 1, name: 'Übersicht' })).toBeVisible()
    await expect(hint(page)).toHaveCount(0)
  })
})
