// Sauberes Beenden (UMSETZUNG M11-01): Compose schickt SIGTERM, Strg+C im Terminal SIGINT. Im
// Container läuft Node als Prozess 1 und beendet sich ohne eigenen Handler gar nicht.
import type { Logger } from '@/shared/lib/logger'

const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT'] as const
type ShutdownSignal = (typeof SHUTDOWN_SIGNALS)[number]

interface SignalSource {
  once: (signal: ShutdownSignal, listener: () => void) => unknown
}

interface ShutdownOptions {
  stop: () => Promise<void>
  logger: Logger
  onFailure: () => void
}

/** Ruft `stop` beim ersten Signal genau einmal auf. Weitere Signale ändern nichts mehr. */
export function stopOnSignal(source: SignalSource, options: ShutdownOptions): void {
  let isStopping = false
  const handle = (signal: ShutdownSignal) => {
    if (isStopping) return
    isStopping = true
    options.logger.info('Worker wird beendet', { signal })
    options.stop().then(
      () => {
        options.logger.info('Worker beendet')
      },
      (error: unknown) => {
        options.logger.error('Worker ließ sich nicht sauber beenden', { error })
        options.onFailure()
      },
    )
  }
  for (const signal of SHUTDOWN_SIGNALS)
    source.once(signal, () => {
      handle(signal)
    })
}
