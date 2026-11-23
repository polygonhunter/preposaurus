'use client'

import { Button } from '@/shared/ui/Button'
import { useRestock, type SuggestionEntry } from './restock-context'

type AddSuggestionButtonProps = Readonly<{ suggestion: SuggestionEntry }>

// „Auf die Liste“ (A14, #200): Aus dem Vorschlag wird ein echter Eintrag. Der Name des Lebensmittels
// steht für Screenreader mit im Knopf, der sichtbare Text bleibt kurz.
export function AddSuggestionButton({ suggestion }: AddSuggestionButtonProps) {
  const { addSuggestion, isLocked } = useRestock()
  return (
    <Button
      variant="tinted"
      disabled={isLocked}
      onClick={() => {
        addSuggestion(suggestion)
      }}
    >
      Auf die Liste<span className="sr-only">: {suggestion.label}</span>
    </Button>
  )
}
