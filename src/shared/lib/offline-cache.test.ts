import { describe, expect, it } from 'vitest'
import {
  cacheNamesFor,
  endsSession,
  isPageCache,
  outdatedCaches,
  shouldStorePage,
  strategyFor,
  warmStrategyFor,
} from './offline-cache'

type RequestFacts = Parameters<typeof strategyFor>[0]

const ORIGIN = 'https://vorrat.beispiel.ts.net'
const url = (path: string) => new URL(path, ORIGIN)

const request = (path: string, overrides: Partial<RequestFacts> = {}): RequestFacts => ({
  method: 'GET',
  url: url(path),
  origin: ORIGIN,
  mode: 'navigate',
  isRsc: false,
  ...overrides,
})

describe('strategyFor', () => {
  it('speichert Seitenaufrufe nach dem Prinzip „Netz zuerst“', () => {
    expect(strategyFor(request('/uebersicht'))).toBe('pages')
    expect(strategyFor(request('/vorrat?status=bald'))).toBe('pages')
  })

  it('fasst API-Antworten nie an, auch nicht als Seitenaufruf', () => {
    expect(strategyFor(request('/api/photos/123', { mode: 'cors' }))).toBe('network')
    expect(strategyFor(request('/api/health', { mode: 'same-origin' }))).toBe('network')
    expect(strategyFor(request('/api/photos/123'))).toBe('network')
  })

  it('lässt Server Actions und andere Schreibzugriffe durch', () => {
    expect(strategyFor(request('/vorrat', { method: 'POST' }))).toBe('network')
  })

  it('lässt RSC-Abrufe durch, damit Next bei fehlendem Netz die ganze Seite lädt', () => {
    expect(strategyFor(request('/vorrat', { isRsc: true, mode: 'cors' }))).toBe('network')
    expect(strategyFor(request('/vorrat?_rsc=abc', { mode: 'cors' }))).toBe('network')
  })

  it('lässt fremde Adressen durch', () => {
    expect(strategyFor(request('https://example.org/uebersicht'))).toBe('network')
  })

  it('speichert Next-Dateien, Icons und Manifest nach dem Prinzip „Cache zuerst“', () => {
    expect(strategyFor(request('/_next/static/chunks/app.js', { mode: 'no-cors' }))).toBe('files')
    expect(strategyFor(request('/icons/icon-192.png', { mode: 'no-cors' }))).toBe('files')
    expect(strategyFor(request('/manifest.webmanifest', { mode: 'cors' }))).toBe('files')
  })
})

describe('shouldStorePage', () => {
  const page = { ok: true, redirected: false, contentType: 'text/html; charset=utf-8' }

  it('speichert Übersicht und Vorrat samt Unterseiten', () => {
    expect(shouldStorePage({ ...page, finalUrl: url('/uebersicht') })).toBe(true)
    expect(shouldStorePage({ ...page, finalUrl: url('/vorrat/getreide') })).toBe(true)
  })

  it('speichert keine anderen Seiten, etwa Einstellungen oder Erfassen', () => {
    expect(shouldStorePage({ ...page, finalUrl: url('/einstellungen') })).toBe(false)
    expect(shouldStorePage({ ...page, finalUrl: url('/neu') })).toBe(false)
    expect(shouldStorePage({ ...page, finalUrl: url('/vorratsliste') })).toBe(false)
  })

  it('speichert keine Weiterleitung, keine Fehlerseite und kein Nicht-HTML', () => {
    expect(shouldStorePage({ ...page, redirected: true, finalUrl: url('/vorrat') })).toBe(false)
    expect(shouldStorePage({ ...page, ok: false, finalUrl: url('/vorrat') })).toBe(false)
    expect(shouldStorePage({ ...page, contentType: null, finalUrl: url('/vorrat') })).toBe(false)
  })
})

describe('endsSession', () => {
  it('erkennt Anmelden und Einrichten', () => {
    expect(endsSession(url('/anmelden?weiter=%2Fvorrat'))).toBe(true)
    expect(endsSession(url('/einrichten'))).toBe(true)
    expect(endsSession(url('/uebersicht'))).toBe(false)
  })
})

describe('warmStrategyFor', () => {
  it('nimmt nur Dateien und die Offline-Seiten an', () => {
    expect(warmStrategyFor(url('/_next/static/css/app.css'), ORIGIN)).toBe('files')
    expect(warmStrategyFor(url('/uebersicht'), ORIGIN)).toBe('pages')
    expect(warmStrategyFor(url('/api/photos/1'), ORIGIN)).toBe('network')
    expect(warmStrategyFor(url('/einstellungen'), ORIGIN)).toBe('network')
    expect(warmStrategyFor(new URL('https://example.org/_next/static/a.js'), ORIGIN)).toBe(
      'network',
    )
  })
})

describe('Cache-Namen', () => {
  const current = cacheNamesFor('2')

  it('trennt Seiten (Haushaltsdaten) von Dateien', () => {
    expect(isPageCache(current.pages)).toBe(true)
    expect(isPageCache(current.files)).toBe(false)
  })

  it('räumt nur alte Caches der App auf', () => {
    const old = cacheNamesFor('1')
    expect(outdatedCaches([old.pages, old.files, current.pages, 'fremd'], current)).toEqual([
      old.pages,
      old.files,
    ])
  })
})
