import { describe, expect, it } from 'vitest'
import {
  GLOBAL_LOCK_KEY,
  GLOBAL_RULE,
  IP_RULE,
  NAME_RULE,
  ipLockKey,
  minutesUntil,
  nameLockKey,
} from './sign-in-brake'

const MINUTE = 60_000
const now = new Date('2026-11-22T10:00:00Z')
const later = (ms: number) => new Date(now.getTime() + ms)

describe('Bremse je Benutzername', () => {
  it('sperrt erst ab dem fünften Versuch', () => {
    expect(NAME_RULE.lockMsAfter(4)).toBe(0)
    expect(NAME_RULE.lockMsAfter(5)).toBe(MINUTE)
  })

  it('verdoppelt die Wartezeit je Versuch bis höchstens 15 Minuten', () => {
    expect([6, 7, 8, 9, 20].map(NAME_RULE.lockMsAfter)).toEqual([
      2 * MINUTE,
      4 * MINUTE,
      8 * MINUTE,
      15 * MINUTE,
      15 * MINUTE,
    ])
  })

  it('zählt ohne Zeitfenster bis zum nächsten Erfolg', () => {
    expect(NAME_RULE.windowMs).toBeNull()
  })
})

describe('Bremse je Adresse', () => {
  it('sperrt beim zwanzigsten Versuch im 10-Minuten-Fenster für 10 Minuten', () => {
    expect(IP_RULE.windowMs).toBe(10 * MINUTE)
    expect(IP_RULE.lockMsAfter(19)).toBe(0)
    expect(IP_RULE.lockMsAfter(20)).toBe(10 * MINUTE)
  })
})

describe('Globale Obergrenze', () => {
  it('pausiert alle für 1 Minute ab dem hundertsten Versuch im 10-Minuten-Fenster', () => {
    expect(GLOBAL_RULE.windowMs).toBe(10 * MINUTE)
    expect(GLOBAL_RULE.lockMsAfter(99)).toBe(0)
    expect(GLOBAL_RULE.lockMsAfter(100)).toBe(MINUTE)
  })
})

describe('minutesUntil', () => {
  it('rundet auf ganze Minuten auf und nennt mindestens 1', () => {
    expect(minutesUntil(later(4 * MINUTE + 1), now)).toBe(5)
    expect(minutesUntil(later(MINUTE), now)).toBe(1)
    expect(minutesUntil(now, now)).toBe(1)
  })
})

describe('Schlüssel', () => {
  it('trennt Namen und Adressen', () => {
    expect(nameLockKey('alex')).toBe('name:alex')
    expect(ipLockKey('100.64.0.1')).toBe('ip:100.64.0.1')
    expect(GLOBAL_LOCK_KEY).toBe('global')
  })

  it('fasst Anfragen ohne erkennbare Adresse unter einem Schlüssel zusammen', () => {
    expect(ipLockKey(null)).toBe('ip:unbekannt')
  })
})
