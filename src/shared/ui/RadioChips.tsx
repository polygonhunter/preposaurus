'use client'

import { useId, type ChangeEvent } from 'react'

type RadioChipOption = Readonly<{ value: string; label: string }>

type RadioChipsProps = Readonly<{
  legend: string
  name: string
  options: readonly RadioChipOption[]
  defaultValue?: string | undefined
  onChange?: (value: string) => void
  // Fehler steht direkt unter der Auswahl (DESIGN_SYSTEM §7)
  error?: string | undefined
}>

// Einfachauswahl mit mehr als vier Werten als Chip-Reihe (statt Dropdown, DESIGN_SYSTEM §7). Echte
// Radio-Knöpfe, damit Pfeiltasten, Formulare und Screenreader ohne Zusatz funktionieren.
export function RadioChips({
  legend,
  name,
  options,
  defaultValue,
  onChange,
  error,
}: RadioChipsProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)
  const errorId = `${useId()}-fehler`
  return (
    <fieldset aria-describedby={error ? errorId : undefined} className="flex flex-col gap-1.5">
      <legend className="px-4 pb-1.5 text-footnote text-fg2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="relative flex">
            <input
              type="radio"
              name={name}
              value={option.value}
              defaultChecked={option.value === defaultValue}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="touch-target inline-flex cursor-pointer items-center rounded-full bg-surface px-3.5 py-1.5 text-callout inset-ring inset-ring-line-strong transition-colors duration-150 ease-out peer-checked:bg-fg peer-checked:text-bg peer-checked:inset-ring-transparent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p id={errorId} className="px-4 text-footnote text-red">
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
