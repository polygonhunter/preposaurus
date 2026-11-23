import { describe, expect, it } from 'vitest'
import { toCalendarDay } from '@/shared/lib/dates'
import { doubtAboutBestBefore } from './best-before-plausibility'

const today = toCalendarDay('2026-11-23')
const on = (date: string) => ({ date: toCalendarDay(date) })

describe('doubtAboutBestBefore', () => {
  it('fragt bei einem Datum vor heute nach', () => {
    expect(doubtAboutBestBefore(on('2020-01-01'), today)).toBe('in-past')
    expect(doubtAboutBestBefore(on('2026-11-22'), today)).toBe('in-past')
  })

  it('fragt bei mehr als 30 Jahren in der Zukunft nach', () => {
    expect(doubtAboutBestBefore(on('2099-12-31'), today)).toBe('far-future')
    expect(doubtAboutBestBefore(on('2056-11-24'), today)).toBe('far-future')
  })

  it('lässt heute und übliche Daten ohne Rückfrage', () => {
    expect(doubtAboutBestBefore(on('2026-11-23'), today)).toBeNull()
    expect(doubtAboutBestBefore(on('2051-06-30'), today)).toBeNull()
    expect(doubtAboutBestBefore(on('2056-11-23'), today)).toBeNull()
  })
})
