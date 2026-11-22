export function readSecret(): string | undefined {
  return process.env['SECRET']
}
