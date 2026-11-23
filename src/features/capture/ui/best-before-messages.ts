// Meldungen, wenn sich ein eingetipptes MHD nicht lesen lässt (#53). Gleich beim Erfassen und
// beim Ändern eines Datums (#49). Es wird nie ein Datum geraten, die App fragt nach.
import type { BestBeforeParseError } from '../domain/best-before'

export const PARSE_MESSAGES: Record<BestBeforeParseError['kind'], string> = {
  empty: 'Bitte gebt das Datum ein, wie es aufgedruckt ist, oder wählt „Datum fehlt“.',
  'no-date': 'Das ist kein Datum. Bitte so eingeben: 30.09.2027, 09/2027 oder 2027.',
  incomplete: 'Bitte mit Jahr eingeben, z. B. 30.09.2027.',
  ambiguous: 'Bitte das Jahr vierstellig eingeben, z. B. 09/2027.',
  'invalid-date': 'Diesen Tag gibt es nicht. Bitte prüft das Datum.',
  'year-out-of-range': 'Bitte ein Jahr zwischen 2000 und 2099 eingeben.',
}
