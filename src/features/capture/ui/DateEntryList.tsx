'use client'
import { useId, useLayoutEffect, useRef } from 'react'
import type { DateKind } from '@/features/inventory/domain/unit'
import { Group } from '@/shared/ui/Group'
import { Row } from '@/shared/ui/Row'
import {
  changeDateCount,
  changeDateKind,
  dateEntryKey,
  dateEntryLabel,
  isKindFixed,
  type DateEntry,
} from '../domain/date-entries'
import { MAX_COUNT_PER_DATE } from '../schemas/stock'
import { ESTIMATE_ROW_NOTE, kindChangedNote } from './best-before-messages'
import { CountStepper } from './CountStepper'
import { DATE_KIND_EXPLANATION, DateKindChoice } from './DateKindChoice'

type DateEntryListProps = Readonly<{
  entries: readonly DateEntry[]
  labelledBy: string
  onChange: (entries: DateEntry[]) => void
  // Eine Zeile ist weg (Anzahl auf 0): Der Fokus braucht ein neues Ziel
  onRowRemoved: () => void
  // Satz nach dem Umschalten der Art, leer oder „Zusammengeführt …“
  onKindChange: (note: string) => void
}>

interface FocusTarget {
  name: string
  kind: DateKind
}

// Je Datum eine Zeile „09/2027 · − 2× +“, darunter der Umschalter MHD · Verbrauchsdatum (#294),
// „Datum fehlt“ zuletzt. Eine Schätzung ist immer ein MHD (#180), dort steht statt des Umschalters
// „Geschätzt, kein Aufdruck“. Die Art gehört zum Schlüssel der Zeile: Nach dem Umschalten entsteht
// sie neu, darum holt die Liste den Fokus auf die gewählte Art in der neuen Zeile zurück.
export function DateEntryList({
  entries,
  labelledBy,
  onChange,
  onRowRemoved,
  onKindChange,
}: DateEntryListProps) {
  const baseName = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const focusAfterChange = useRef<FocusTarget | null>(null)
  const nameOf = (key: string) => `${baseName}-${key}`

  useLayoutEffect(() => {
    const target = focusAfterChange.current
    if (target === null) return
    focusAfterChange.current = null
    const selector = `input[name="${CSS.escape(target.name)}"][value="${target.kind}"]`
    listRef.current?.querySelector<HTMLInputElement>(selector)?.focus()
  })

  if (entries.length === 0) return null
  return (
    <div ref={listRef} className="pt-3">
      <Group labelledBy={labelledBy}>
        {entries.map((entry) => {
          const key = dateEntryKey(entry)
          const label = dateEntryLabel(entry)
          return (
            <Row
              key={key}
              title={label}
              trailing={
                <CountStepper
                  label={label}
                  count={entry.count}
                  max={MAX_COUNT_PER_DATE}
                  onChange={(delta) => {
                    const next = changeDateCount(entries, { key, delta })
                    if (next.length < entries.length) onRowRemoved()
                    onChange(next)
                  }}
                />
              }
              footer={
                isKindFixed(entry) ? (
                  <p className="text-footnote text-fg2">{ESTIMATE_ROW_NOTE}</p>
                ) : (
                  <div className="w-full max-w-xs">
                    <DateKindChoice
                      legend={`Datumsart für ${label}`}
                      name={nameOf(key)}
                      value={entry.kind ?? 'best-before'}
                      onChange={(kind) => {
                        const nextKey = dateEntryKey({ ...entry, kind })
                        const next = changeDateKind(entries, { key, kind })
                        focusAfterChange.current = { name: nameOf(nextKey), kind }
                        onKindChange(kindChangedNote(next, nextKey, next.length < entries.length))
                        onChange(next)
                      }}
                    />
                  </div>
                )
              }
            />
          )
        })}
      </Group>
      <p className="px-8 pt-2 text-footnote text-fg2 breit:px-10">{DATE_KIND_EXPLANATION}</p>
    </div>
  )
}
