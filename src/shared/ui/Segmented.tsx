'use client'

import type { ChangeEvent } from 'react'

type SegmentOption = Readonly<{ value: string; label: string }>

type SegmentedProps = Readonly<{
  // Name der Auswahl für Screenreader, z. B. „Zeitraum“
  legend: string
  name: string
  options: readonly SegmentOption[]
  defaultValue?: string
  onChange?: (value: string) => void
}>

// Segment-Steuerung für 2–4 Werte. Echte Radio-Knöpfe, damit Pfeiltasten und Formulare ohne JS gehen.
export function Segmented({ legend, name, options, defaultValue, onChange }: SegmentedProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)
  return (
    <fieldset className="flex rounded-segment bg-fill p-0.5">
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="relative flex min-h-10 flex-1">
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={option.value === defaultValue}
            onChange={handleChange}
            className="peer sr-only"
          />
          <span className="flex flex-1 cursor-pointer items-center justify-center rounded-thumb px-2 text-footnote font-medium transition-colors duration-150 ease-out peer-checked:bg-surface peer-checked:font-semibold peer-checked:shadow-thumb peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-accent">
            {option.label}
          </span>
        </label>
      ))}
    </fieldset>
  )
}
