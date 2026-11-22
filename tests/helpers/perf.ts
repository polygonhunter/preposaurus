// Laufzeit-Grenzen (#141) laufen nur auf Wunsch: `npm run test:perf`, in der CI als eigener Schritt
// ohne andere Testdateien daneben. In der normalen Suite streuen Zeiten mit Coverage und parallelen
// Dateien zu stark, ein ausgelasteter Rechner würde sonst den Push blockieren.

// eslint-disable-next-line no-restricted-properties -- Testumgebung schaltet die Messung zu, die App liest weiter nur env.ts
export const isPerfRun = process.env['PERF'] === '1'

const RUNS = 3

/** Schnellster von drei Läufen nach einem Aufwärmlauf, damit eine kurze Lastspitze nicht zählt. */
export async function fastestRun(run: () => Promise<unknown>): Promise<number> {
  await run()
  let fastest = Number.POSITIVE_INFINITY
  for (let attempt = 0; attempt < RUNS; attempt += 1) {
    const start = performance.now()
    await run()
    fastest = Math.min(fastest, performance.now() - start)
  }
  return fastest
}
