import { EmptyState } from '@/shared/ui/EmptyState'
import type { Overview } from '../schemas'
import { GoalGroup } from './GoalGroup'
import { OVERVIEW_PATHS } from './overview-paths'
import { SupplyHero } from './SupplyHero'

type SupplyBlockProps = Readonly<{ overview: Pick<Overview, 'supply' | 'goal' | 'nextStep'> }>

// Ohne Bedarf (keine Mitglieder oder keine Quelle) gibt es keine Tage: ein Satz, eine Handlung.
const NO_NEED = {
  text: 'Tragt ein, wer zum Haushalt gehört. Dann seht ihr hier, wie lange euer Vorrat reicht.',
  action: { href: OVERVIEW_PATHS.settings, label: 'Haushalt einrichten' },
}

// Kopf der Übersicht: „Heute versorgt“, darunter Zielzeile und nächster Schritt (#68).
export function SupplyBlock({ overview }: SupplyBlockProps) {
  const { supply, goal, nextStep } = overview
  if (supply === null) return <EmptyState {...NO_NEED} />
  return (
    <>
      <SupplyHero supply={supply} goalDays={goal?.days ?? null} />
      {goal === null ? null : <GoalGroup goal={goal} nextStep={nextStep} />}
    </>
  )
}
