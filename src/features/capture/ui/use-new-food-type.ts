// Zustand des Blatts „Neue Lebensmittelart“ (#142, #110): Name, Kategorie, Antwort der Action. Eine
// ähnliche vorhandene Art (gleicher Name oder Suchwort) prüft schon das Gerät, damit niemand erst
// nach dem Tippen auf „Anlegen“ von der Dublette erfährt. Der Server prüft dasselbe noch einmal.
import { useState, useTransition } from 'react'
import { addFoodTypeAction, type AddFoodTypeOutcome } from '../actions/add-food-type-action'
import type { FoodTypeChoice } from '../domain/capture-options'
import { findSimilarFoodType } from '../domain/similar-food-type'

export type AddFoodTypeProblem = Extract<AddFoodTypeOutcome, { ok: false }>

export interface NewFoodTypeDraft {
  name: string
  categoryId: string
}

interface NewFoodTypeSetup {
  foodTypes: readonly FoodTypeChoice[]
  initial: NewFoodTypeDraft
  /** Antwort eines Versuchs vor dem Öffnen, z. B. „Übernehmen“ im Vorschlag */
  initialProblem?: AddFoodTypeProblem | null | undefined
  onAdded: (foodType: FoodTypeChoice) => void
}

export function useNewFoodType({ foodTypes, initial, initialProblem, onAdded }: NewFoodTypeSetup) {
  const [draft, setDraft] = useState(initial)
  const [problem, setProblem] = useState(initialProblem ?? null)
  const [isPending, startTransition] = useTransition()
  const similar = problem?.similar ?? findSimilarFoodType(foodTypes, draft.name)

  function change(update: Partial<NewFoodTypeDraft>) {
    setDraft((previous) => ({ ...previous, ...update }))
    setProblem(null)
  }

  function create() {
    if (similar !== null || isPending) return
    startTransition(async () => {
      const outcome = await addFoodTypeAction(draft)
      if (outcome.ok) onAdded(outcome.foodType)
      else setProblem(outcome)
    })
  }

  return { draft, change, create, similar, problem, isPending }
}
