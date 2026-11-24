// Eigene Lebensmittelarten mit Richtwerten und Reihenfolge (#243). Alle Projekte teilen sich einen
// Haushalt, deshalb legt nur „desktop“ etwas an und räumt danach auf. Die Seiten selbst prüft axe
// in jeder Stufe, hell und dunkel.
import type { Page } from '@playwright/test'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

const title = (page: Page, name: string) => page.getByRole('heading', { level: 1, name })

async function createFoodType(page: Page, categoryId: string, name: string) {
  await page.goto(`/einstellungen/lebensmittelarten/neu?kategorie=${categoryId}`)
  await page.getByLabel('Name der Lebensmittelart').fill(name)
  await page.getByRole('button', { name: 'Anlegen' }).click()
  await expect(title(page, name)).toBeVisible()
}

async function removeFoodType(page: Page, name: string) {
  await page.getByRole('link', { name: new RegExp(`^${name}`) }).click()
  await page.getByRole('button', { name: 'Lebensmittelart löschen' }).click()
  await page
    .getByRole('dialog', { name: `„${name}“ löschen?` })
    .getByRole('button', { name: 'Löschen' })
    .click()
}

test('eigene Art mit Makros und Haltbarkeit anlegen und in der Kategorie sortieren', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'desktop', 'Ändert den ganzen Haushalt, läuft nur auf Desktop')
  await page.goto('/einstellungen/kategorien/neu')
  await page.getByLabel('Name der Kategorie').fill('Richtwert-Test')
  await page.getByText('Sonstiges', { exact: true }).click()
  await page.getByRole('button', { name: 'Anlegen' }).click()
  await expect(title(page, 'Richtwert-Test')).toBeVisible()
  const categoryUrl = page.url()
  const categoryId = categoryUrl.split('/').at(-1) ?? ''

  await createFoodType(page, categoryId, 'Testkorn A')
  const fat = page.getByLabel('Fett in g')
  await page.getByLabel('Brennwert in kcal').fill('352')
  await page.getByLabel('Eiweiß in g').fill('11,5')
  await page.getByLabel('Kohlenhydrate in g').fill('68')
  await fat.fill('150')
  await page.getByLabel('Übliche Haltbarkeit in Monaten (freiwillig)').fill('18')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(fat).toHaveAccessibleDescription('Bitte die Gramm als Zahl von 0 bis 100 eintragen.')
  await expect(fat).toBeFocused()
  await expectAccessibleLayout(page)

  await fat.fill('2,5')
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page.getByText('Gespeichert.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Eiweiß in g')).toHaveValue('11,5')
  await expect(page.getByLabel('Fett in g')).toHaveValue('2,5')
  await expect(page.getByLabel('Übliche Haltbarkeit in Monaten (freiwillig)')).toHaveValue('18')

  await createFoodType(page, categoryId, 'Testkorn B')
  await page.goto(categoryUrl)
  const list = page.getByRole('list', { name: 'Lebensmittelarten' })
  await expect(list.getByRole('listitem').first()).toContainText('Testkorn A')
  await expect(page.getByRole('button', { name: 'Testkorn A nach oben' })).toBeDisabled()
  // Der gedrückte Knopf behält den Fokus, auch wenn er am Rand gesperrt ist oder die Zeile rückt
  const bUp = page.getByRole('button', { name: 'Testkorn B nach oben' })
  await bUp.click()
  await expect(list.getByRole('listitem').first()).toContainText('Testkorn B')
  await expect(bUp).toBeDisabled()
  await expect(bUp).toBeFocused()
  const bDown = page.getByRole('button', { name: 'Testkorn B nach unten' })
  await bDown.focus()
  await page.keyboard.press('Enter')
  await expect(list.getByRole('listitem').first()).toContainText('Testkorn A')
  await expect(bDown).toBeFocused()
  await page.getByRole('button', { name: 'Testkorn B nach oben' }).click()
  await expect(list.getByRole('listitem').first()).toContainText('Testkorn B')
  await expect(page.getByText('Eure eigenen Arten stehen vorn')).toBeVisible()
  await expectAccessibleLayout(page)

  await removeFoodType(page, 'Testkorn A')
  await page.goto(categoryUrl)
  await removeFoodType(page, 'Testkorn B')
  await page.goto(categoryUrl)
  await page.getByRole('button', { name: 'Kategorie löschen' }).click()
  await page
    .getByRole('dialog', { name: '„Richtwert-Test“ löschen?' })
    .getByRole('button', { name: 'Löschen' })
    .click()
  await expect(page).toHaveURL(/\/einstellungen\/kategorien$/)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test(`Richtwerte im Formular und bei der Startliste sind barrierefrei (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme })
    await page.goto('/einstellungen/lebensmittelarten/neu')
    await expect(title(page, 'Neue Lebensmittelart')).toBeVisible()
    await expect(
      page.getByRole('group', { name: 'Richtwerte je 100 g oder ml (freiwillig)' }),
    ).toBeVisible()
    await expectAccessibleLayout(page)

    await page.goto('/einstellungen/lebensmittelarten?suche=Hirse')
    await page
      .getByRole('list', { name: 'Treffer' })
      .getByRole('link', { name: /^Hirse/ })
      .click()
    await expect(title(page, 'Hirse')).toBeVisible()
    const facts = page.getByRole('list', { name: 'Richtwerte je 100 g oder ml' })
    await expect(facts).toContainText('Übliche Haltbarkeit')
    await expectAccessibleLayout(page)
  })
}
