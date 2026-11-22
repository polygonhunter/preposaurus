// Hülle für einen Klartext-Schlüssel im Speicher. Logger, JSON.stringify, Template-Strings und
// util.inspect sehen nur „[geheim]“. Den Wert gibt nur reveal() heraus, und zwar ausschließlich an
// der Stelle, die ihn wirklich braucht (der Adapter beim Aufruf des Anbieters).
import 'server-only'
import { inspect } from 'node:util'

const MASK = '[geheim]'

export class SecretValue {
  readonly #value: string

  constructor(value: string) {
    this.#value = value
  }

  reveal(): string {
    return this.#value
  }

  toString(): string {
    return MASK
  }

  toJSON(): string {
    return MASK
  }

  [inspect.custom](): string {
    return MASK
  }
}
