// Behälter sind Merkmale, keine Kategorien: „Dose“ ist ein Filter (01 „Ordnungssystem“).
// Die Schlüssel kommen aus CONTAINER_KEYS, hier stehen nur die Anzeigenamen.
import { CONTAINER_KEYS, type ContainerKey } from '../../../src/shared/config/constants'

const CONTAINER_NAMES: Readonly<Record<ContainerKey, string>> = {
  dose: 'Dose',
  glas: 'Glas',
  packung: 'Packung',
  flasche: 'Flasche',
  tetrapak: 'Tetrapak',
  beutel: 'Beutel',
}

export const CONTAINERS = CONTAINER_KEYS.map((key) => ({ key, name: CONTAINER_NAMES[key] }))
