import { useId } from 'react'
import { Chip } from '@/shared/ui/Chip'
import { ChipRow } from '@/shared/ui/ChipRow'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import type { NamedChoice } from '../domain/capture-options'

type ChoiceChipsProps = Readonly<{
  label: string
  choices: readonly NamedChoice[]
  selectedId: string | null
  onChange: (id: string | null) => void
  /** Steht da, wenn es nichts zu wählen gibt */
  emptyText: string
}>

// Einfachauswahl als Chip-Reihe statt Dropdown (DESIGN_SYSTEM §7). Ein zweites Tippen auf den
// gewählten Chip hebt die Wahl wieder auf, denn Behälter und Lagerort sind freiwillig.
export function ChoiceChips({ label, choices, selectedId, onChange, emptyText }: ChoiceChipsProps) {
  const headerId = useId()
  return (
    <section aria-labelledby={headerId}>
      <GroupHeader id={headerId} trailing="freiwillig">
        {label}
      </GroupHeader>
      {choices.length === 0 ? (
        <p className="px-8 text-footnote text-fg2 breit:px-10">{emptyText}</p>
      ) : (
        <ChipRow label={label}>
          {choices.map((choice) => {
            const isActive = choice.id === selectedId
            return (
              <Chip
                key={choice.id}
                isActive={isActive}
                onClick={() => {
                  onChange(isActive ? null : choice.id)
                }}
              >
                {choice.name}
              </Chip>
            )
          })}
        </ChipRow>
      )}
    </section>
  )
}
