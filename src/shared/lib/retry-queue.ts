// Warteschlange für Arbeit im Hintergrund, z. B. Foto-Uploads (#61): höchstens `concurrency`
// Aufgaben gleichzeitig, eine geworfene Ausnahme wird mit wachsender Pause wiederholt. Nach dem
// letzten Versuch bleibt die Aufgabe `failed` und lässt sich von Hand neu anstoßen. Ohne React und
// ohne Browser, damit sie mit falscher Uhr testbar ist.

type QueueStatus = 'waiting' | 'running' | 'done' | 'failed'

export interface QueueUpdate<T> {
  id: string
  status: QueueStatus
  /** Begonnene Versuche, ab 1 */
  attempt: number
  /** Nur bei `done` */
  result?: T
}

interface QueueOptions<T> {
  concurrency: number
  maxAttempts: number
  /** Pause vor dem zweiten Versuch, danach je Versuch ein Vielfaches */
  retryDelayMs: number
  onUpdate: (update: QueueUpdate<T>) => void
  /** Ersetzbar in Tests */
  wait?: (ms: number) => Promise<void>
}

interface Entry<T> {
  id: string
  run: () => Promise<T>
  attempt: number
}

interface QueueState<T> {
  options: QueueOptions<T>
  waiting: Entry<T>[]
  failed: Map<string, Entry<T>>
  running: number
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

async function execute<T>(queue: QueueState<T>, entry: Entry<T>) {
  const { onUpdate, maxAttempts, retryDelayMs } = queue.options
  entry.attempt += 1
  onUpdate({ id: entry.id, status: 'running', attempt: entry.attempt })
  try {
    const result = await entry.run()
    onUpdate({ id: entry.id, status: 'done', attempt: entry.attempt, result })
  } catch {
    // Erwartet: Netz weg oder Server beschäftigt. Der Zustand zeigt es, nichts wird verschluckt.
    if (entry.attempt < maxAttempts) {
      await (queue.options.wait ?? sleep)(retryDelayMs * entry.attempt)
      queue.waiting.unshift(entry)
    } else {
      queue.failed.set(entry.id, entry)
      onUpdate({ id: entry.id, status: 'failed', attempt: entry.attempt })
    }
  }
}

function pump<T>(queue: QueueState<T>) {
  while (queue.running < queue.options.concurrency && queue.waiting.length > 0) {
    const entry = queue.waiting.shift()
    if (entry === undefined) return
    queue.running += 1
    void execute(queue, entry).finally(() => {
      queue.running -= 1
      pump(queue)
    })
  }
}

function enqueue<T>(queue: QueueState<T>, entry: Entry<T>) {
  queue.waiting.push(entry)
  queue.options.onUpdate({ id: entry.id, status: 'waiting', attempt: 0 })
  pump(queue)
}

export function createRetryQueue<T>(options: QueueOptions<T>) {
  const queue: QueueState<T> = { options, waiting: [], failed: new Map(), running: 0 }
  return {
    add(id: string, run: () => Promise<T>) {
      enqueue(queue, { id, run, attempt: 0 })
    },
    /** Eine gescheiterte Aufgabe bekommt wieder alle Versuche. */
    retry(id: string) {
      const entry = queue.failed.get(id)
      if (entry === undefined) return
      queue.failed.delete(id)
      entry.attempt = 0
      enqueue(queue, entry)
    },
  }
}
