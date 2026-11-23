// Verdrahtung der Ampel-Schwellen für Seiten und Actions (#78).
import 'server-only'
import { getDb } from '@/server/db/get-db'
import {
  createAmpelSettingsRepository,
  type AmpelSettingsStore,
} from '../data/ampel-settings-repository'

export async function ampelServices(): Promise<Readonly<{ ampel: AmpelSettingsStore }>> {
  return { ampel: createAmpelSettingsRepository(await getDb()) }
}
