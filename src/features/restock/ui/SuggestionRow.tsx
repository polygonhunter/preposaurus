import { Row } from '@/shared/ui/Row'
import type { RestockSuggestionDto } from '../schemas'
import { AddSuggestionButton } from './AddSuggestionButton'
import { suggestionReasonText } from './restock-text'

type SuggestionRowProps = Readonly<{ suggestion: RestockSuggestionDto }>

// Ein Vorschlag unter „Ersetzen“ (A14, #200): live gerechnet, deshalb ohne Haken. Er verschwindet
// von selbst, sobald er auf der Liste steht oder nicht mehr zutrifft.
export function SuggestionRow({ suggestion }: SuggestionRowProps) {
  return (
    <Row
      title={suggestion.label}
      subtitle={suggestionReasonText(suggestion)}
      accessory={
        <div className="-my-2 -mr-1 shrink-0">
          <AddSuggestionButton suggestion={suggestion} />
        </div>
      }
    />
  )
}
