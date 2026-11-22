import { describe, expect, it, vi } from 'vitest'
import { createLogger } from './logger'

type LogLevel = Parameters<typeof createLogger>[0]['level']

function captureLogger(level: LogLevel) {
  const lines: string[] = []
  const logger = createLogger({ level, sink: (line) => lines.push(line) })
  const parsed = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>)
  return { logger, lines, parsed }
}

describe('createLogger', () => {
  it('schreibt eine JSON-Zeile mit Stufe und Nachricht', () => {
    const { logger, parsed } = captureLogger('info')

    logger.info('Vorrat geladen', { count: 3 })

    expect(parsed()).toEqual([
      expect.objectContaining({ level: 'info', message: 'Vorrat geladen', context: { count: 3 } }),
    ])
  })

  it('lässt Meldungen unter der eingestellten Stufe weg', () => {
    const { logger, lines } = captureLogger('warn')

    logger.debug('fein')
    logger.info('normal')
    logger.warn('Achtung')
    logger.error('Fehler')

    expect(lines).toHaveLength(2)
  })

  it('schreibt keine Schlüssel, Passwörter oder Tokens ins Log', () => {
    const { logger, lines } = captureLogger('debug')

    logger.error('Anfrage fehlgeschlagen', {
      apiKey: 'sk-ant-geheim',
      ANTHROPIC_API_KEY: 'sk-ant-geheim',
      nested: { password: 'hunter2', items: [{ sessionToken: 'abc' }] },
      headers: { Authorization: 'Bearer xyz' },
      status: 401,
    })

    const output = lines.join('\n')
    expect(output).not.toMatch(/sk-ant-geheim|hunter2|abc|Bearer xyz/)
    expect(output).toContain('"status":401')
  })

  it('schreibt Fehler mit Name, Nachricht, Stack und Ursache', () => {
    const { logger, parsed } = captureLogger('error')
    const cause = new TypeError('Verbindung abgelehnt')

    logger.error('Speichern fehlgeschlagen', { error: new Error('DB weg', { cause }) })

    const [entry] = parsed()
    expect(entry?.['context']).toEqual({
      error: {
        name: 'Error',
        message: 'DB weg',
        stack: expect.stringContaining('DB weg') as unknown,
        cause: {
          name: 'TypeError',
          message: 'Verbindung abgelehnt',
          stack: expect.stringContaining('Verbindung abgelehnt') as unknown,
        },
      },
    })
  })

  it('kappt sehr tief verschachtelte Kontexte', () => {
    const { logger, lines } = captureLogger('info')

    logger.info('tief', { a: { b: { c: { d: { e: { f: { g: 'Ende' } } } } } } })

    expect(lines.join('')).toContain('[zu tief]')
  })

  it('schreibt ohne eigenes Ziel auf die Konsole', () => {
    const write = vi.spyOn(console, 'log').mockImplementation(() => undefined)

    createLogger({ level: 'info' }).info('Start')

    expect(write).toHaveBeenCalledWith(expect.stringContaining('"message":"Start"'))
    write.mockRestore()
  })
})
