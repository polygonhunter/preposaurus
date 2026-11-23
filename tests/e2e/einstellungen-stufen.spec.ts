import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout, expectNothingOnVerticalFold } from '../helpers/page-checks'

// Einstellungen je Stufe (UX §8.6, M12-06, #95): kompakt ist die Liste eine eigene Seite und jeder
// Bereich eine Unterseite mit „Zurück“, ab „breit“ steht die Liste links neben dem Bereich. Die
// Auswahl ist die Adresse. Diese Tests ändern nichts.

const BREIT = 900
const WEIT = 1280

const widthOf = (page: Page) => page.viewportSize()?.width ?? 0
const areaList = (page: Page) => page.getByRole('region', { name: 'Bereiche der Einstellungen' })
const title = (page: Page, name: string) => page.getByRole('heading', { level: 1, name })

test('kompakt: Liste als eigene Seite, der Bereich ersetzt sie, „Zurück“ führt zur Liste', async ({
  page,
}) => {
  test.skip(widthOf(page) >= BREIT, 'Nur unter „breit“')
  await page.goto('/einstellungen')
  await expect(title(page, 'Einstellungen')).toBeVisible()

  await areaList(page)
    .getByRole('link', { name: /Ziel und Empfehlung/ })
    .click()
  await expect(title(page, 'Ziel und Empfehlung')).toBeVisible()
  await expect(areaList(page)).toBeHidden()

  await page.getByRole('link', { name: 'Einstellungen' }).click()
  await expect(title(page, 'Einstellungen')).toBeVisible()
})

test.describe('ab „breit“', () => {
  test.beforeEach(({ page }) => {
    test.skip(widthOf(page) < BREIT, 'Liste und Bereich nebeneinander erst ab 900 px')
  })

  test('Liste links, Bereich rechts, Auswahl ist die Adresse, Zurück wählt den vorigen', async ({
    page,
  }) => {
    await page.goto('/einstellungen')
    await expect(areaList(page)).toBeVisible()
    await expect(page.getByText('Wählt links einen Bereich, er öffnet sich hier.')).toBeVisible()

    const goal = areaList(page).getByRole('link', { name: /Ziel und Empfehlung/ })
    await goal.click()
    await expect(page).toHaveURL(/\/einstellungen\/ziel$/)
    await expect(title(page, 'Ziel und Empfehlung')).toBeVisible()
    await expect(goal).toHaveAttribute('aria-current', 'page')
    const [listBox, titleBox] = await Promise.all([
      areaList(page).boundingBox(),
      title(page, 'Ziel und Empfehlung').boundingBox(),
    ])
    expect(titleBox?.x ?? 0).toBeGreaterThan((listBox?.x ?? 0) + (listBox?.width ?? 0) - 1)

    await areaList(page)
      .getByRole('link', { name: /Lagerorte/ })
      .click()
    await expect(title(page, 'Lagerorte')).toBeVisible()
    await expect(goal).not.toHaveAttribute('aria-current')

    await page.goBack()
    await expect(page).toHaveURL(/\/einstellungen\/ziel$/)
    await expect(goal).toHaveAttribute('aria-current', 'page')
  })

  test('Unterseiten markieren ihren Bereich', async ({ page }) => {
    await page.goto('/einstellungen/lebensmittelarten')
    await expect(
      areaList(page).getByRole('link', { name: 'Kategorien und Lebensmittelarten' }),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('Liste und Bereich lassen die Mitte frei (Falz beim Duo quer)', async ({ page }) => {
    test.skip(widthOf(page) >= WEIT, 'Am PC gibt es keine Falz')
    for (const path of ['/einstellungen', '/einstellungen/ziel', '/einstellungen/konto']) {
      await page.goto(path)
      await expect(areaList(page)).toBeVisible()
      await expectNothingOnVerticalFold(page)
    }
  })

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Liste und Bereich sind barrierefrei (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme })
      for (const path of ['/einstellungen', '/einstellungen/konto', '/einstellungen/regeln']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expectAccessibleLayout(page)
      }
    })
  }
})
