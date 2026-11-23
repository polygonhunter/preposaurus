import { expect, test } from '../helpers/e2e-test'

test('/api/health antwortet ohne Anmeldung nur mit dem Status', async ({ request }) => {
  const response = await request.get('/api/health')

  expect(response.status()).toBe(200)
  expect(response.headers()['cache-control']).toBe('no-store')
  expect(await response.json()).toEqual({ status: 'ok' })
})
