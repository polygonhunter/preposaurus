'use client'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { GroupHeader } from '@/shared/ui/GroupHeader'
import { todayInBerlin } from '@/shared/lib/dates'
import { detectDateKind, parseBestBefore } from '../domain/best-before'
import { doubtAboutBestBefore } from '../domain/best-before-plausibility'
import { addDateEntry, type DateEntry } from '../domain/date-entries'
import { addedDateNote, PARSE_MESSAGES } from './best-before-messages'
import { DateEntryList } from './DateEntryList'
import { QuickCounts } from './QuickCounts'

type BestBeforeEntriesProps = Readonly<{
  entries: readonly DateEntry[]
  onChange: (entries: DateEntry[]) => void
  error: string | undefined
}>

const HINT =
  'Wie aufgedruckt: 30.09.2027, 09/2027 oder 2027, auch mit „zu verbrauchen bis“. Gleiches Datum zählt hoch.'

/** Beim Speichern steht noch ein Datum im Feld, das nicht hinzugefügt wurde. */
const PENDING_MESSAGE = 'Bitte übernimm das Datum mit Enter oder „Datum hinzufügen“.'

// MHD manuell (#53): je Datum ein Eintrag mit Anzahl, „Datum fehlt“ als eigene Wahl (#116).
// Die Genauigkeit folgt der Eingabe (Tag, Monat oder Jahr). Es wird nie ein Datum vorgeschlagen.
// Steht „zu verbrauchen bis“ davor, wird der Eintrag ein Verbrauchsdatum und sagt es (#294). Jeder
// Eintrag hat den Umschalter MHD · Verbrauchsdatum, vorbelegt von Erkennung oder KI.
// Darunter die Schnellzahlen, gleich im Formular und im Foto-Weg (#211).
export function BestBeforeEntries({ entries, onChange, error }: BestBeforeEntriesProps) {
  const headerId = useId()
  const [text, setText] = useState('')
  const [parseError, setParseError] = useState<string>()
  // Erkannte Datumsart und Rückfrage nach dem Hinzufügen (#218, #294)
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const isPending = error !== undefined && entries.length === 0 && text.trim() !== ''
  const fieldError = parseError ?? (isPending ? PENDING_MESSAGE : error)

  function addTyped() {
    const today = todayInBerlin(new Date())
    const parsed = parseBestBefore(text, today)
    if (!parsed.ok) {
      setParseError(PARSE_MESSAGES[parsed.error.kind])
      return
    }
    const kind = detectDateKind(text)
    setParseError(undefined)
    setNote(addedDateNote({ doubt: doubtAboutBestBefore(parsed.value, today), kind }))
    setText('')
    onChange(addDateEntry(entries, parsed.value, kind ?? undefined))
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
          hint={HINT}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setNote('')
          }}
          onKeyDown={addOnEnter}
          ref={inputRef}
          error={fieldError}
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="tinted" onClick={addTyped}>
            Datum hinzufügen
          </Button>
          <Button
            variant="tinted"
            onClick={() => {
              setParseError(undefined)
              setNote('')
              onChange(addDateEntry(entries, null))
            }}
          >
            Datum fehlt
          </Button>
        </div>
        <p role="status" className="px-4 text-footnote text-fg2 empty:hidden">
          {note}
        </p>
      </div>
      <DateEntryList
        entries={entries}
        labelledBy={headerId}
        onChange={onChange}
        // Verschwindet die Zeile samt Knopf, bleibt der Fokus nicht im Nichts, sondern im Feld.
        onRowRemoved={() => inputRef.current?.focus()}
        onKindChange={setNote}
      />
      <QuickCounts units={entries} onChange={onChange} />
    </section>
  )
}
