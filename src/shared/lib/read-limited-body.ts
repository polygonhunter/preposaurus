// Liest einen Anfrage-Body höchstens bis zur Grenze. So landet ein riesiger Upload nie ganz im
// Speicher: Beim ersten Byte zu viel bricht das Lesen ab, egal was Content-Length behauptet.

function concat(chunks: readonly Uint8Array[], total: number): Uint8Array {
  const result = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }
  return result
}

/** Ganzer Inhalt, oder null, wenn er größer als `maxBytes` ist. Ohne Body: leeres Array. */
export async function readLimitedBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<Uint8Array | null> {
  if (body === null) return new Uint8Array(0)
  const reader = body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return concat(chunks, total)
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      return null
    }
    chunks.push(value)
  }
}
