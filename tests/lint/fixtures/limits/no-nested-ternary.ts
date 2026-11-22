export function label(n: number): string {
  return n > 1 ? 'viele' : n === 1 ? 'eins' : 'keins'
}
