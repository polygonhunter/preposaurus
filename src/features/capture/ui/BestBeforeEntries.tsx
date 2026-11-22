'use client'
import { useId, useState, type KeyboardEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { todayInBerlin } from '@/shared/lib/dates'
import { parseBestBefore, type BestBeforeParseError } from '../domain/best-before'
import { addDateEntry, changeDateCount, type DateEntry } from '../domain/date-entries'
import { DateEntryList } from './DateEntryList'

type BestBeforeEntriesProps = Readonly<{
  entries: readonly DateEntry[]
  onChange: (entries: DateEntry[]) => void
  error: string | undefined
}>

const PARSE_MESSAGES: Record<BestBeforeParseError['kind'], string> = {
  empty: 'Bitte gib das Datum ein, wie es aufgedruckt ist, oder wähle „Datum fehlt“.',
  'no-date': 'Das ist kein Datum. Bitte so eingeben: 30.09.2027, 09/2027 oder 2027.',
  incomplete: 'Bitte mit Jahr eingeben, z. B. 30.09.2027.',
  ambiguous: 'Bitte das Jahr vierstellig eingeben, z. B. 09/2027.',
  'invalid-date': 'Diesen Tag gibt es nicht. Bitte prüfe das Datum.',
  'year-out-of-range': 'Bitte ein Jahr zwischen 2000 und 2099 eingeben.',
}

// MHD manuell (#53): je Datum ein Eintrag mit Anzahl, „Datum fehlt“ als eigene Wahl (#116).
// Die Genauigkeit folgt der Eingabe (Tag, Monat oder Jahr). Es wird nie ein Datum vorgeschlagen.
export function BestBeforeEntries({ entries, onChange, error }: BestBeforeEntriesProps) {
  const headerId = useId()
  const [text, setText] = useState('')
  const [parseError, setParseError] = useState<string>()

  function addTyped() {
    const parsed = parseBestBefore(text, todayInBerlin(new Date()))
    if (!parsed.ok) {
      setParseError(PARSE_MESSAGES[parsed.error.kind])
      return
    }
    setParseError(undefined)
    setText('')
    onChange(addDateEntry(entries, parsed.value))
  }

  function addOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    // Enter fügt das Datum hinzu, statt das ganze Formular abzuschicken.
    event.preventDefault()
    addTyped()
  }

  return (
    <section aria-labelledby={headerId}>
      <GroupHeader id={headerId}>MHD und Anzahl</GroupHeader>
      <div className="mx-4 flex flex-col gap-3 breit:mx-6">
        <Field
          label="Mindestens haltbar bis"
          name="mhd"
          inputMode="text"
          autoComplete="off"
          placeholder="z. B. 09/2027"
          hint="Wie aufgedruckt: 30.09.2027, 09/2027 oder 2027. Gleiches Datum zählt hoch."
          value={text}
          onChange={(event) => {
            setText(event.target.value)
          }}
          onKeyDown={addOnEnter}
          error={parseError ?? error}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="tinted" onClick={addTyped}>
            Datum hinzufügen
          </Button>
          <Button
            variant="tinted"
            onClick={() => {
              setParseError(undefined)
              onChange(addDateEntry(entries, null))
            }}
          >
            Datum fehlt
          </Button>
        </div>
      </div>
      <DateEntryList
        entries={entries}
        labelledBy={headerId}
        onCountChange={(key, delta) => {
          onChange(changeDateCount(entries, { key, delta }))
        }}
      />
    </section>
  )
}
