import { EmptyState } from '@/shared/ui/EmptyState'
import type { Overview } from '../schemas'
import { GoalGroup } from './GoalGroup'
import { noNeedState } from './source-text'
import { SupplyHero } from './SupplyHero'

type SupplyBlockProps = Readonly<{
  overview: Pick<Overview, 'supply' | 'goal' | 'nextStep' | 'household'>
}>

// Kopf der Übersicht: „Heute versorgt“, darunter Zielzeile und nächster Schritt (#68). Ohne Bedarf
// gibt es keine Tage: ein Satz nach Ursache (keine Quelle, keine Mitglieder), eine Handlung (#206).
export function SupplyBlock({ overview }: SupplyBlockProps) {
  const { supply, goal, nextStep } = overview
  if (supply === null) return <EmptyState {...noNeedState(overview.household)} />
  return (
    <>
      <SupplyHero supply={supply} goalDays={goal?.days ?? null} />
      {goal === null ? null : <GoalGroup goal={goal} nextStep={nextStep} />}
    </>
  )
}
