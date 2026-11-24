import type { AmpelThresholds } from '@/features/inventory/domain/unit-state'
import { DEFAULT_AMPEL_ORANGE_DAYS, DEFAULT_AMPEL_YELLOW_DAYS } from '@/shared/config/constants'

/** Standard-Schwellen der Ampel wie in der DB (bald fällig bis 3 Monate, dringend bis 4 Wochen). */
export const DEFAULT_AMPEL_THRESHOLDS: AmpelThresholds = {
  soonDays: DEFAULT_AMPEL_YELLOW_DAYS,
  urgentDays: DEFAULT_AMPEL_ORANGE_DAYS,
}
