// Daten & System für Admins (#80, #147): letzte Sicherung aus einer Test-Statusdatei und Export als
// JSON. Mitglieder sehen beides nicht und bekommen den Export auch per Direktaufruf nicht.
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Page } from '@playwright/test'
import { E2E_BACKUP_STATUS_DIR, E2E_MEMBER, signedOut, signInViaUi } from '../helpers/e2e-auth'
import { expect, test } from '../helpers/e2e-test'
import { expectAccessibleLayout } from '../helpers/page-checks'

const HOUR_MS = 60 * 60 * 1000

async function writeBackupStatus(lastBackupAt: Date, lastRun: string) {
  await mkdir(E2E_BACKUP_STATUS_DIR, { recursive: true })
  const line = `${lastBackupAt.toISOString()} taeglich/stand`
  await writeFile(join(E2E_BACKUP_STATUS_DIR, 'letzte-sicherung'), `${line}\n`)
  await writeFile(join(E2E_BACKUP_STATUS_DIR, 'letzter-lauf'), `${lastRun}\n`)
}

const backupFooter = (page: Page) => page.getByText(/Dienst „backup“/)

test.describe('als Admin', () => {
  test('zeigt die letzte Sicherung und einen ruhigen Hinweis, wenn sie alt ist', async ({
    page,
  }, info) => {
    test.skip(info.project.name !== 'desktop', 'teilt sich die Statusdatei, läuft einmal')
    const recent = new Date(Date.now() - 2 * HOUR_MS)
    await writeBackupStatus(recent, `ok ${recent.toISOString()} taeglich/stand`)
    try {
      await page.goto('/einstellungen/system')
      await expect(page.getByRole('heading', { level: 2, name: 'Sicherung' })).toBeVisible()
      await expect(page.getByText('tägliche Sicherung')).toBeVisible()
      await expect(backupFooter(page)).toContainText('sichert jede Nacht')
      await expectAccessibleLayout(page)

      const old = new Date(Date.now() - 30 * HOUR_MS)
      await writeBackupStatus(old, `ok ${old.toISOString()} taeglich/stand`)
      await page.reload()
      await expect(backupFooter(page)).toContainText('schon etwas her')

      await writeBackupStatus(recent, `fehler ${new Date().toISOString()} taeglich`)
      await page.reload()
      await expect(backupFooter(page)).toContainText('hat nicht geklappt')
    } finally {
      await rm(E2E_BACKUP_STATUS_DIR, { recursive: true, force: true })
    }
  })

  test('lädt den Export als JSON ohne Geheimnisse herunter', async ({ page }, info) => {
    test.skip(!['desktop', 'iphone'].includes(info.project.name), 'je eine Engine reicht')
    await page.goto('/einstellungen')
    await page.getByRole('link', { name: /Sicherung, Export und Lizenz/ }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Export' })).toBeVisible()
    await expectAccessibleLayout(page)

    const downloading = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Herunterladen' }).click()
    const download = await downloading
    expect(download.suggestedFilename()).toMatch(/^preposaurus-export-\d{4}-\d{2}-\d{2}\.json$/)
    const text = await readFile(await download.path(), 'utf8')
    const content = JSON.parse(text) as { format: string; products: unknown[] }
    expect(content.format).toBe('preposaurus-haushalt')
    expect(content.products.length).toBeGreaterThan(0)
    expect(text).not.toMatch(/"(password|token|email)"/)
  })
})

test.describe('als Mitglied', () => {
  test.use(signedOut)

  test('sieht weder Sicherung noch Export, der Export antwortet mit 404', async ({ page }) => {
    await signInViaUi(page, E2E_MEMBER)
    await page.goto('/einstellungen/system')

    await expect(page.getByRole('heading', { level: 1, name: 'Daten & System' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Sicherung' })).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 2, name: 'Export' })).toHaveCount(0)
    const response = await page.request.get('/api/export')
    expect(response.status()).toBe(404)
    expect(response.headers()['content-disposition']).toBeUndefined()
  })
})
