// Aufbewahrung des Backup-Containers (docker/backup/rotate.sh), aufgerufen wie im Container.
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const ROTATE_SCRIPT = join(import.meta.dirname, '../../docker/backup/rotate.sh')

function pruneOld(dir: string, keep: number): void {
  execFileSync('sh', ['-c', '. "$1"; prune_old "$2" "$3"', 'sh', ROTATE_SCRIPT, dir, String(keep)])
}

describe('prune_old', () => {
  let dir: string

  const createStands = (names: readonly string[]) => {
    for (const name of names) {
      mkdirSync(join(dir, name, 'fotos'), { recursive: true })
      writeFileSync(join(dir, name, 'datenbank.dump'), name)
    }
  }

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rotation-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('behält die 7 neuesten Tagesstände und löscht ältere samt Inhalt', () => {
    createStands(Array.from({ length: 10 }, (_, day) => `2026-11-${String(day + 10)}`))

    pruneOld(dir, 7)

    expect(readdirSync(dir).sort()).toEqual([
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
      '2026-11-16',
      '2026-11-17',
      '2026-11-18',
      '2026-11-19',
    ])
  })

  it('rotiert Stände mit Uhrzeit, auch mehrere am selben Tag', () => {
    createStands([
      '2026-11-21_030000',
      '2026-11-22_010000',
      '2026-11-22_030000',
      '2026-11-20_030000',
    ])

    pruneOld(dir, 2)

    expect(readdirSync(dir).sort()).toEqual(['2026-11-22_010000', '2026-11-22_030000'])
  })

  it('sortiert über den Jahreswechsel richtig und behält 4 Wochenstände', () => {
    createStands(['2026-W51', '2025-W52', '2026-W52', '2026-W53', '2027-W01', '2026-W50'])

    pruneOld(dir, 4)

    expect(readdirSync(dir).sort()).toEqual(['2026-W51', '2026-W52', '2026-W53', '2027-W01'])
  })

  it('lässt laufende Stände und fremde Dateien unberührt', () => {
    createStands(['2026-11-20', '2026-11-21', '.laufend-2026-11-22'])
    writeFileSync(join(dir, 'notiz.txt'), 'bleibt')

    pruneOld(dir, 1)

    expect(readdirSync(dir).sort()).toEqual(['.laufend-2026-11-22', '2026-11-21', 'notiz.txt'])
  })

  it('löscht nichts, solange es höchstens so viele Stände wie erlaubt gibt', () => {
    createStands(['2026-11-21', '2026-11-22'])

    pruneOld(dir, 7)

    expect(readdirSync(dir)).toHaveLength(2)
  })

  it('kommt mit einem fehlenden Ordner zurecht', () => {
    expect(() => {
      pruneOld(join(dir, 'gibt-es-nicht'), 7)
    }).not.toThrow()
  })
})
