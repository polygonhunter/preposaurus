import { expect, test } from '@playwright/test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Viewports aus Issue #35. Der Test setzt sie selbst, darum läuft er nur in einem Projekt.
const VIEWPORTS = [
  { width: 375, height: 812 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]
const COLOR_SCHEMES = ['light', 'dark'] as const

for (const viewport of VIEWPORTS) {
  for (const colorScheme of COLOR_SCHEMES) {
    test(`Musterseite besteht axe bei ${String(viewport.width)} px (${colorScheme})`, async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'einmal je Viewport reicht')
      await page.setViewportSize(viewport)
      await page.emulateMedia({ colorScheme })
      await page.goto('/muster')

      await expect(page.getByRole('heading', { level: 1, name: 'Musterseite' })).toBeVisible()
      await expect(page.getByRole('region', { name: 'Dunkel' })).toBeVisible()
      await expectAccessibleLayout(page)
    })
  }
}

test('Blatt öffnet sich als Dialog und schließt mit Escape', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'einmal reicht')
  await page.goto('/muster')
  const light = page.getByRole('region', { name: 'Hell' })

  await light.getByRole('button', { name: 'Blatt öffnen' }).click()
  const sheet = page.getByRole('dialog', { name: 'Haferflocken' })
  await expect(sheet).toBeVisible()
  await expectAccessibleLayout(page)

  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
})

test('Blatt schließt mit Tippen auf den Hintergrund, nicht auf den Inhalt', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'einmal reicht')
  await page.goto('/muster')
  await page
    .getByRole('region', { name: 'Hell' })
    .getByRole('button', { name: 'Blatt öffnen' })
    .click()
  const sheet = page.getByRole('dialog', { name: 'Haferflocken' })

  await sheet.getByRole('heading', { name: 'Haferflocken' }).click()
  await expect(sheet).toBeVisible()

  await page.mouse.click(5, 5)
  await expect(sheet).toBeHidden()
})
