// Höchstens eine Wiederholung (technik.html#api-ki, DATENKATALOG §8.3 Nr. 4). Der Adapter
// entscheidet, welche Fehler wiederholbar sind (429 und 5xx) und wie lange gewartet wird.
import type { Result } from '@/shared/lib/result'

export interface RetryPolicy<E> {
  /** null: nicht wiederholen. Sonst die Wartezeit in ms vor dem zweiten Versuch */
  retryDelayMs: (error: E) => number | null
  sleep: (ms: number) => Promise<void>
}

export async function retryOnce<T, E>(
  attempt: () => Promise<Result<T, E>>,
  policy: RetryPolicy<E>,
): Promise<Result<T, E>> {
  const first = await attempt()
  if (first.ok) return first
  const delayMs = policy.retryDelayMs(first.error)
  if (delayMs === null) return first
  await policy.sleep(delayMs)
  return attempt()
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
