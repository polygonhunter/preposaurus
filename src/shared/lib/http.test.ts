import { describe, expect, it } from 'vitest'
import { errorResponse, isCrossSiteRequest, noStoreJson, readJsonBody } from './http'

describe('noStoreJson und errorResponse', () => {
  it('antwortet mit JSON, Status und ohne Cache', async () => {
    const response = noStoreJson({ a: 1 }, 201)

    expect(response.status).toBe(201)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.json()).toEqual({ a: 1 })
  })

  it('verpackt Fehler als Feld „fehler“', async () => {
    const response = errorResponse(404, 'Nicht gefunden.')

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ fehler: 'Nicht gefunden.' })
  })
})

describe('errorResponse mit Grund', () => {
  it('gibt den Grund für die Oberfläche mit', async () => {
    expect(await errorResponse(503, 'Aus.', 'ai-disabled').json()).toEqual({
      fehler: 'Aus.',
      grund: 'ai-disabled',
    })
  })
})

describe('readJsonBody', () => {
  const post = (body: string) => new Request('https://app.test/api', { method: 'POST', body })

  it('liest kleines JSON', async () => {
    expect(await readJsonBody(post('{"a":1}'), 100)).toEqual({ a: 1 })
  })

  it('ergibt undefined bei kaputtem JSON', async () => {
    expect(await readJsonBody(post('{a:'), 100)).toBeUndefined()
  })

  it('ergibt undefined, wenn der Body zu groß ist', async () => {
    expect(await readJsonBody(post(`"${'x'.repeat(200)}"`), 100)).toBeUndefined()
  })
})

describe('isCrossSiteRequest', () => {
  const request = (site?: string) =>
    new Request('https://app.test/api', {
      headers: site === undefined ? {} : { 'sec-fetch-site': site },
    })

  it.each([
    ['cross-site', true],
    ['same-origin', false],
    ['same-site', false],
    ['none', false],
  ])('Sec-Fetch-Site %s ergibt %s', (site, expected) => {
    expect(isCrossSiteRequest(request(site))).toBe(expected)
  })

  it('lässt Anfragen ohne den Header zu (ältere Browser, Werkzeuge)', () => {
    expect(isCrossSiteRequest(request())).toBe(false)
  })
})
