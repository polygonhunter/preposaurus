import { useId } from 'react'
import { Field } from '@/shared/ui/Field'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { SearchField } from '@/shared/ui/SearchField'
import { Segmented } from '@/shared/ui/Segmented'
import { Toggle } from '@/shared/ui/Toggle'

const PERIODS = [
  { value: 'woche', label: 'Woche' },
  { value: 'monat', label: 'Monat' },
  { value: 'jahr', label: 'Jahr' },
]

export function InputSection() {
  const segmentName = useId()
  return (
    <>
      <GroupHeader>Eingaben</GroupHeader>
      <div className="mx-4 flex flex-col gap-4">
        <SearchField label="Vorrat durchsuchen" />
        <Segmented legend="Zeitraum" name={segmentName} options={PERIODS} defaultValue="monat" />
        <Field label="Bezeichnung" placeholder="z. B. Haferflocken" hint="So steht es im Vorrat." />
        <Field
          label="Menge"
          defaultValue="0"
          inputMode="decimal"
          error="Bitte eine Menge über 0 eintragen."
        />
        <div className="rounded-group bg-surface px-4">
          <Toggle label="Erinnerungen per Push" defaultChecked />
          <Toggle label="Wöchentliche Zusammenfassung" />
        </div>
      </div>
    </>
  )
}
