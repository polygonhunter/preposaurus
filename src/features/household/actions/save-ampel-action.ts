'use server'
// Ampel-Schwellen speichern (EIN-05, #78), nur der Admin. Fehler stehen am Feld, die Eingaben
// behält das Formular. Danach zeigt die Seite den gespeicherten Stand.
import { refresh } from 'next/cache'
import { z } from 'zod'
import { ampelServices } from '@/features/inventory/application/ampel-services'
import { saveAmpelThresholds } from '@/features/inventory/application/ampel-thresholds'
import type { ThresholdError } from '@/features/inventory/domain/unit-state'
import { adminAccessMessage } from '@/server/auth/admin-access-message'
import { requireHouseholdAdmin } from '@/server/auth/guards'
import { MIN_AMPEL_ORANGE_DAYS } from '@/shared/config/constants'
import { firstMessages, readFormText } from '@/shared/lib/form-data'
import { ampelThresholdsSchema } from '../schemas'

type AmpelField = 'soonDays' | 'urgentDays'

export type AmpelFormState = Readonly<{
  status: 'idle' | 'saved' | 'error'
  message: string | null
  errors: Partial<Record<AmpelField, string>>
  values: Readonly<Record<AmpelField, string>> | null
}>

const THRESHOLD_ERRORS: Record<ThresholdError['kind'], Partial<Record<AmpelField, string>>> = {
  'not-a-whole-number': { soonDays: 'Bitte ganze Tage eintragen.' },
  'urgent-below-week': {
    urgentDays: `Bitte mindestens ${String(MIN_AMPEL_ORANGE_DAYS)} Tage, weil „Diese Woche“ schon ${String(MIN_AMPEL_ORANGE_DAYS)} Tage umfasst.`,
  },
  'urgent-above-soon': { urgentDays: 'Orange kommt nach Gelb, darf also nicht mehr Tage haben.' },
}

const failed = (
  values: AmpelFormState['values'],
  errors: AmpelFormState['errors'],
  message: string | null = null,
): AmpelFormState => ({ status: 'error', message, errors, values })

export async function saveAmpelAction(
  _previous: AmpelFormState,
  formData: FormData,
): Promise<AmpelFormState> {
  const values = {
    soonDays: readFormText(formData, 'gelb'),
    urgentDays: readFormText(formData, 'orange'),
  }
  const admin = await requireHouseholdAdmin()
  if (!admin.ok) return failed(values, {}, adminAccessMessage(admin.error))
  const parsed = ampelThresholdsSchema.safeParse(values)
  if (!parsed.success)
    return failed(values, firstMessages(z.flattenError(parsed.error).fieldErrors))
  const result = await saveAmpelThresholds(await ampelServices(), {
    householdId: admin.value.householdId,
    thresholds: parsed.data,
  })
  if (!result.ok) return failed(values, THRESHOLD_ERRORS[result.error.kind])
  refresh()
  return { status: 'saved', message: 'Gespeichert.', errors: {}, values }
}
