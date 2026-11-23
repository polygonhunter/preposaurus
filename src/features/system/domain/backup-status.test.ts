import { describe, expect, it } from 'vitest'
import { evaluateBackupStatus } from './backup-status'

const now = new Date('2026-11-23T10:00:00+01:00')
const lastBackup = '2026-11-23T03:00:12+01:00 taeglich/2026-11-23_030000'

describe('evaluateBackupStatus', () => {
  it('meldet eine frische Sicherung mit Zeitpunkt und Art', () => {
    const status = evaluateBackupStatus({ lastRun: `ok ${lastBackup}`, lastBackup }, now)

    expect(status).toEqual({
      state: 'ok',
      lastBackup: { at: new Date('2026-11-23T03:00:12+01:00'), kind: 'taeglich' },
    })
  })

  it('meldet eine Sicherung, die älter als 26 Stunden ist, als veraltet', () => {
    const old = '2026-11-22T07:59:00+01:00 manuell/2026-11-22_075900'
    const status = evaluateBackupStatus({ lastRun: `ok ${old}`, lastBackup: old }, now)

    expect(status).toMatchObject({ state: 'stale', lastBackup: { kind: 'manuell' } })
  })

  it('lässt eine Sicherung von genau 26 Stunden noch gelten', () => {
    const edge = '2026-11-22T08:00:00+01:00 taeglich/2026-11-22_080000'

    expect(evaluateBackupStatus({ lastRun: null, lastBackup: edge }, now).state).toBe('ok')
  })

  it('meldet einen Fehlschlag nach der letzten Sicherung und behält deren Zeitpunkt', () => {
    const status = evaluateBackupStatus(
      { lastRun: 'fehler 2026-11-23T03:00:40+01:00 taeglich', lastBackup: lastBackup },
      now,
    )

    expect(status).toMatchObject({ state: 'failed', lastBackup: { kind: 'taeglich' } })
  })

  it('übergeht einen älteren Fehlschlag', () => {
    const status = evaluateBackupStatus(
      { lastRun: 'fehler 2026-11-22T03:00:40+01:00 taeglich', lastBackup },
      now,
    )

    expect(status.state).toBe('ok')
  })

  it('meldet einen Fehlschlag auch ohne bisherige Sicherung', () => {
    const status = evaluateBackupStatus(
      { lastRun: 'fehler 2026-11-23T03:00:40+01:00 taeglich', lastBackup: null },
      now,
    )

    expect(status).toEqual({ state: 'failed', lastBackup: null })
  })

  it('ist ohne Dateien oder mit unlesbarem Inhalt unbekannt', () => {
    expect(evaluateBackupStatus({ lastRun: null, lastBackup: null }, now)).toEqual({
      state: 'unknown',
    })
    expect(evaluateBackupStatus({ lastRun: 'ok', lastBackup: 'kaputt fremd/x' }, now)).toEqual({
      state: 'unknown',
    })
    expect(
      evaluateBackupStatus({ lastRun: null, lastBackup: 'gestern taeglich/2026' }, now),
    ).toEqual({ state: 'unknown' })
  })
})
