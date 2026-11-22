import { describe, expect, it } from 'vitest'
import { errorResponse, isCrossSiteRequest, noStoreJson } from './http'

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
