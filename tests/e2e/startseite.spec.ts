import { expect, test } from '@playwright/test'
import { expectAccessibleLayout } from '../helpers/page-checks'

test('Startseite zeigt den Platzhalter barrierefrei und ohne waagrechtes Scrollen', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page.locator('html')).toHaveAttribute('lang', 'de')
  await expect(page.getByRole('heading', { level: 1, name: 'Preposaurus' })).toBeVisible()
  await expectAccessibleLayout(page)
})
