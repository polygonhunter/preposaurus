'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/shared/ui/Button'
import { addFoodTypeAction } from '../actions/add-food-type-action'
import type { CaptureOptions, FoodTypeChoice } from '../domain/capture-options'
import { NewFoodTypeSheet } from './NewFoodTypeSheet'
import type { FoodTypeProposal } from './photo-capture-state'
import type { AddFoodTypeProblem } from './use-new-food-type'

type FoodTypeProposalOfferProps = Readonly<{
  proposal: FoodTypeProposal
  options: Pick<CaptureOptions, 'foodTypes' | 'categories'>
  onChosen: (foodType: FoodTypeChoice) => void
  /** „Andere wählen“: Vorschlag weg, weiter mit der Suche */
  onDismiss: () => void
}>

type SheetState = Readonly<{ problem: AddFoodTypeProblem | null }>

const offerText = ({ name, categoryName }: FoodTypeProposal) =>
  `Keine Lebensmittelart der Liste passt. Neue Lebensmittelart „${name}“ unter „${categoryName}“ anlegen?`

// Vorschlag der Erkennung (#142): ein ruhiges Angebot, nie automatisch angelegt. „Übernehmen“ legt
// die Art mit Name und Kategorie der KI an, „Ändern“ öffnet dasselbe Blatt wie „+ Neue
// Lebensmittelart“. Admin und Mitglied dürfen beide anlegen (#298).
export function FoodTypeProposalOffer(props: FoodTypeProposalOfferProps) {
  const { proposal, options, onChosen, onDismiss } = props
  const [sheet, setSheet] = useState<SheetState | null>(null)
  const [isPending, startTransition] = useTransition()

  function accept() {
    const { categoryId } = proposal
    if (categoryId === null) {
      setSheet({ problem: null })
      return
    }
    startTransition(async () => {
      const outcome = await addFoodTypeAction({ name: proposal.name, categoryId })
      if (outcome.ok) onChosen(outcome.foodType)
      else setSheet({ problem: outcome })
    })
  }

  return (
    <section
      aria-label="Vorschlag der Erkennung"
      className="mx-4 flex flex-col gap-2 rounded-group bg-surface px-4 py-3 breit:mx-6"
    >
      <p className="text-callout">{offerText(proposal)}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="tinted"
          onClick={accept}
          pendingLabel={isPending ? 'Legt an …' : undefined}
        >
          Übernehmen
        </Button>
        <Button
          variant="plain"
          onClick={() => {
            setSheet({ problem: null })
          }}
        >
          Ändern
        </Button>
        <Button variant="plain" onClick={onDismiss}>
          Andere wählen
        </Button>
      </div>
      {sheet === null ? null : (
        <NewFoodTypeSheet
          foodTypes={options.foodTypes}
          categories={options.categories}
          initial={{ name: proposal.name, categoryId: proposal.categoryId ?? '' }}
          initialProblem={sheet.problem}
          onClose={() => {
            setSheet(null)
          }}
          onChosen={onChosen}
        />
      )}
    </section>
  )
}
