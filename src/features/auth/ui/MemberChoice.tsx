'use client'
import { RadioChips } from '@/shared/ui/RadioChips'

export type MemberOption = Readonly<{ id: string; name: string }>

type MemberChoiceProps = Readonly<{
  members: readonly MemberOption[]
  defaultValue: string
  error?: string | undefined
}>

// Verknüpfung Nutzer ↔ Person (HH-06), freiwillig. „Keine“ für Konten ohne Platz im Bedarf.
export function MemberChoice({ members, defaultValue, error }: MemberChoiceProps) {
  const options = [
    { value: '', label: 'Keine' },
    ...members.map((member) => ({ value: member.id, label: member.name })),
  ]
  return (
    <RadioChips
      legend="Zählt im Haushalt als"
      name="person"
      options={options}
      defaultValue={defaultValue}
      error={error}
    />
  )
}
