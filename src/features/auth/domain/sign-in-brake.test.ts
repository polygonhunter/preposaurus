import { describe, expect, it } from 'vitest'
import {
  ipLockKey,
  nameLockDurationMs,
  nameLockKey,
  registerIpFailure,
  registerNameFailure,
  remainingLockMinutes,
  type LockState,
} from './sign-in-brake'

const MINUTE = 60_000
const now = new Date('2026-11-22T10:00:00Z')
const later = (ms: number) => new Date(now.getTime() + ms)

function repeat(times: number, step: (state: LockState | null) => LockState): LockState | null {
  let state: LockState | null = null
  for (let index = 0; index < times; index += 1) state = step(state)
  return state
}

describe('Bremse je Benutzername', () => {
  it('bremst erst ab dem fünften Fehlversuch', () => {
    expect(nameLockDurationMs(4)).toBe(0)
    expect(nameLockDurationMs(5)).toBe(MINUTE)
  })

  it('verdoppelt die Wartezeit je Fehlversuch bis höchstens 15 Minuten', () => {
    expect([6, 7, 8, 9, 20].map(nameLockDurationMs)).toEqual([
      2 * MINUTE,
      4 * MINUTE,
      8 * MINUTE,
      15 * MINUTE,
      15 * MINUTE,
    ])
  })

  it('zählt Fehlversuche in Folge und setzt die Sperre ab dem fünften', () => {
    const fourth = repeat(4, (state) => registerNameFailure(state, now))
    const fifth = registerNameFailure(fourth, now)

    expect(fourth).toMatchObject({ failedAttempts: 4, lockedUntil: null, lastFailedAt: now })
    expect(fifth).toMatchObject({ failedAttempts: 5, lockedUntil: later(MINUTE) })
  })
})

describe('Bremse je Adresse', () => {
  it('sperrt beim zwanzigsten Fehlversuch innerhalb von 10 Minuten für 10 Minuten', () => {
    const nineteenth = repeat(19, (state) => registerIpFailure(state, now))
    const twentieth = registerIpFailure(nineteenth, now)

    expect(nineteenth?.lockedUntil).toBeNull()
    expect(twentieth).toMatchObject({ failedAttempts: 20, lockedUntil: later(10 * MINUTE) })
  })

  it('fängt nach 10 Minuten Ruhe wieder bei 1 an', () => {
    const old = { failedAttempts: 19, lastFailedAt: now, lockedUntil: null }

    expect(registerIpFailure(old, later(10 * MINUTE)).failedAttempts).toBe(1)
    expect(registerIpFailure(old, later(10 * MINUTE - 1)).failedAttempts).toBe(20)
  })
})

describe('remainingLockMinutes', () => {
  it('liefert 0 ohne Sperre oder nach ihrem Ende', () => {
    const ended = { failedAttempts: 5, lastFailedAt: now, lockedUntil: now }

    expect(remainingLockMinutes([null], now)).toBe(0)
    expect(remainingLockMinutes([ended], later(1))).toBe(0)
  })

  it('rundet die längste Sperre auf ganze Minuten auf', () => {
    const short = { failedAttempts: 5, lastFailedAt: now, lockedUntil: later(MINUTE) }
    const long = { failedAttempts: 20, lastFailedAt: now, lockedUntil: later(4 * MINUTE + 1) }

    expect(remainingLockMinutes([short, null, long], now)).toBe(5)
  })
})

describe('Schlüssel', () => {
  it('trennt Namen und Adressen', () => {
    expect(nameLockKey('alex')).toBe('name:alex')
    expect(ipLockKey('100.64.0.1')).toBe('ip:100.64.0.1')
  })
})
