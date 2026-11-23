import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

// Rahmen je Stufe (DESIGN_SYSTEM §6, #90, #91, #94): Tab-Leiste in kompakt und mittel, ab „breit“
// die Seitenleiste mit „Erfassen“ oben, Bald fällig eingerückt und Zählern, ab „weit“ Tastenkürzel
// als `kbd`. Andere Tests entnehmen parallel, deshalb vergleichen die Tests Zähler nur innerhalb
// derselben Seite.

const BREIT = 900
const WEIT = 1280

const mainNav = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' })
const widthOf = (page: Page) => page.viewportSize()?.width ?? 0
const heightOf = (page: Page) => page.viewportSize()?.height ?? 0

test.describe('ab „breit“', () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) < BREIT, 'Seitenleiste erst ab 900 px')
  })

  test('Seitenleiste zeigt Bald fällig mit demselben Zähler wie die Übersicht', async ({
    page,
  }) => {
    await page.goto('/uebersicht')
    const allDue = page
      .getByRole('region', { name: 'Bald fällig' })
      .getByRole('link', { name: /^Alle \d+/ })
    const total = (await allDue.textContent())?.match(/\d+/)?.[0] ?? ''

    const due = mainNav(page).getByRole('link', { name: /^Bald fällig/ })
    await expect(due).toHaveAccessibleName(`Bald fällig ${total}`)
    await expect(mainNav(page).getByRole('link', { name: /^Nachkaufen( \d+)?$/ })).toBeVisible()
    await expect(mainNav(page).getByRole('link', { name: 'Übersicht' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    await due.click()
    await expect(page).toHaveURL(/\/uebersicht\/bald-faellig$/)
    await expect(due).toHaveAttribute('aria-current', 'page')
    // Nur das genaueste Ziel ist die aktuelle Seite
    await expect(mainNav(page).getByRole('link', { name: 'Übersicht' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  test('„Erfassen“ steht als Knopf oben in der Seitenleiste', async ({ page }) => {
    await page.goto('/uebersicht')
    const links = mainNav(page).getByRole('link')

    await expect(links.first()).toHaveAccessibleName('Erfassen')
    await expect(links.first()).toHaveAttribute('aria-keyshortcuts', 'n')
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(1)
  })

  test('Übersicht ist zweispaltig erst ab „weit“', async ({ page }) => {
    await page.goto('/uebersicht')
    const hero = page.getByRole('region', { name: 'Euer Vorrat reicht für' })
    const groups = page.getByRole('region', { name: 'Warengruppen' })
    const [heroBox, groupsBox] = await Promise.all([hero.boundingBox(), groups.boundingBox()])

    if (widthOf(page) >= WEIT) {
      expect(groupsBox?.x ?? 0).toBeGreaterThan((heroBox?.x ?? 0) + (heroBox?.width ?? 0) - 1)
    } else {
      expect(groupsBox?.x).toBe(heroBox?.x)
    }
  })
})

test.describe('Tastenkürzel', () => {
  test('„n“ öffnet Erfassen, „/“ springt in die Suche im Vorrat', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Tastenkürzel gibt es nur mit Tastatur')
    await page.goto('/uebersicht')

    await page.keyboard.press('/')
    await expect(page).toHaveURL(/\/vorrat$/)
    const search = page.getByRole('searchbox', { name: 'Vorrat durchsuchen' })
    await expect(search).toBeFocused()

    // Im Eingabefeld ist „n“ ein Buchstabe und kein Kürzel
    await page.keyboard.type('n')
    await expect(search).toHaveValue('n')
    await expect(page).toHaveURL(/\/vorrat$/)

    await search.blur()
    await page.keyboard.press('n')
    await expect(page).toHaveURL(/\/neu(\/foto|\/manuell)?$/)
  })

  test('„/“ fokussiert im Vorrat direkt das Suchfeld', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Tastenkürzel gibt es nur mit Tastatur')
    await page.goto('/vorrat')
    await expect(page.getByRole('heading', { level: 1, name: 'Vorrat' })).toBeVisible()

    await page.keyboard.press('/')

    await expect(page.getByRole('searchbox', { name: 'Vorrat durchsuchen' })).toBeFocused()
    await expect(page).toHaveURL(/\/vorrat$/)
  })

  test('Kürzel stehen erst ab „weit“ sichtbar als Taste da', async ({ page }) => {
    await page.goto('/vorrat')
    const searchKey = page.locator('kbd', { hasText: '/' })
    const captureKey = mainNav(page).locator('kbd')

    if (widthOf(page) >= WEIT) {
      await expect(searchKey).toBeVisible()
      await expect(captureKey).toBeVisible()
    } else {
      await expect(searchKey).toBeHidden()
      await expect(captureKey).toBeHidden()
    }
    await expect(page.getByRole('searchbox', { name: 'Vorrat durchsuchen' })).toHaveAttribute(
      'aria-keyshortcuts',
      '/',
    )
  })
})

test.describe('kompakt und mittel', () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) >= BREIT, 'Tab-Leiste nur unter 900 px')
  })

  test('Tab-Leiste bleibt unten mit Erfassen in der Mitte, ohne Zähler', async ({ page }) => {
    await page.goto('/uebersicht')
    const links = mainNav(page).getByRole('link')

    await expect(links).toHaveCount(5)
    await expect(links.nth(2)).toHaveAccessibleName('Erfassen')
    await expect(mainNav(page).getByRole('link', { name: 'Nachkaufen' })).toHaveAccessibleName(
      'Nachkaufen',
    )
    const box = await mainNav(page).boundingBox()
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeCloseTo(heightOf(page), 0)
  })

  test('nichts Festes und Antippbares liegt auf der Falz (Duo hochkant)', async ({ page }) => {
    test.skip(widthOf(page) < 640 || heightOf(page) < 700, 'Nur in der Stufe mittel')
    await page.goto('/uebersicht')
    const fold = heightOf(page) / 2
    // Feste und klebende Bedienelemente bleiben außerhalb eines Streifens um die Mitte
    const crossing = await page.evaluate((middle) => {
      const fixed = [...document.querySelectorAll<HTMLElement>('a, button, input')].filter(
        (element) => {
          const { position } = getComputedStyle(
            element.closest('nav, [data-bottom-bar]') ?? element,
          )
          return position === 'fixed' || position === 'sticky'
        },
      )
      return fixed.filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.height > 0 && rect.top < middle + 12 && rect.bottom > middle - 12
      }).length
    }, fold)
    expect(crossing).toBe(0)
  })
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Übersicht, Bald fällig und Vorrat sind barrierefrei (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    for (const path of ['/uebersicht', '/uebersicht/bald-faellig', '/vorrat']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectAccessibleLayout(page)
    }
  })
}
