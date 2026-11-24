// Ruhiger Hinweis am Feld „Inhalt je Packung“ (#295): Eine unplausible Menge wie „1.500 l“ fällt
// auf, gespeichert werden darf trotzdem. Es ist ein Hinweis, keine Sperre.
import { parseContentQuantity } from '@/shared/lib/quantities'
import { assessPackageQuantity, type QuantityAssessment } from '../domain/quantity-plausibility'

type ReviewReason = Extract<QuantityAssessment, { status: 'review' }>['reason']

const NOTICES: Record<ReviewReason, string> = {
  'too-large': 'Ungewöhnlich viel für eine Packung. Bitte prüft den Inhalt.',
  'too-small': 'Ungewöhnlich wenig für eine Packung. Bitte prüft den Inhalt.',
}

/** Hinweis zum eingetippten Inhalt, null bei plausibler oder (noch) nicht lesbarer Eingabe. */
export function contentNoticeOf(text: string): string | null {
  const parsed = parseContentQuantity(text)
  if (!parsed.ok) return null
  const assessment = assessPackageQuantity(parsed.value)
  return assessment.status === 'review' ? NOTICES[assessment.reason] : null
}
