import { Button } from '@/shared/ui/Button'
import { BUTTON_VARIANTS } from '@/shared/ui/button-styles'
import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { StatusBadge } from '@/shared/ui/StatusBadge'

const VARIANT_LABELS = {
  primary: 'Speichern',
  tinted: '−1',
  plain: 'Bearbeiten',
  destructive: 'Löschen',
} as const

const CHIPS = ['Alle', 'Getreide', 'Konserven', 'Getränke', 'Hygiene', 'Medizin']

const BADGES = [
  ['red', 'abgelaufen'],
  ['orange', 'dringend'],
  ['yellow', 'bald fällig'],
  ['green', 'gut'],
  ['neutral', 'Datum fehlt'],
] as const

export function ActionsSection() {
  return (
    <>
      <GroupHeader>Knöpfe</GroupHeader>
      <div className="mx-4 flex flex-col items-start gap-3 rounded-group bg-surface p-4">
        {BUTTON_VARIANTS.map((variant) => (
          <Button key={variant} variant={variant}>
            {VARIANT_LABELS[variant]}
          </Button>
        ))}
        <Button pendingLabel="Speichert …">Speichern</Button>
      </div>
      <GroupHeader>Chips</GroupHeader>
      <ChipRow label="Warengruppe">
        {CHIPS.map((label, index) => (
          <Chip key={label} isActive={index === 0}>
            {label}
          </Chip>
        ))}
      </ChipRow>
      <GroupHeader>Zustand</GroupHeader>
      <ul className="mx-4 flex flex-wrap gap-x-5 gap-y-3 rounded-group bg-surface p-4">
        {BADGES.map(([tone, label]) => (
          <li key={tone}>
            <StatusBadge tone={tone} label={label} />
          </li>
        ))}
      </ul>
    </>
  )
}
