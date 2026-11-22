// Begrenzt, wie viele KI-Aufrufe gleichzeitig laufen. Auf dem NAS soll eine MHD-Serie mit vielen
// Fotos weder das Rate-Limit des Anbieters reißen noch den Speicher füllen. Weitere warten in der
// Reihenfolge ihres Eintreffens.
export type ConcurrencyLimit = <T>(task: () => Promise<T>) => Promise<T>

export function createConcurrencyLimit(maxConcurrent: number): ConcurrencyLimit {
  let running = 0
  const waiting: (() => void)[] = []

  const acquire = async () => {
    if (running < maxConcurrent) {
      running += 1
      return
    }
    // Der Platz wird beim Freigeben direkt übergeben, running bleibt gleich.
    await new Promise<void>((resolve) => waiting.push(resolve))
  }

  const release = () => {
    const next = waiting.shift()
    if (next) next()
    else running -= 1
  }

  return async (task) => {
    await acquire()
    try {
      return await task()
    } finally {
      release()
    }
  }
}
