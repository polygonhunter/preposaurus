'use client'

import { useId, type ChangeEvent } from 'react'

type SegmentOption = Readonly<{ value: string; label: string }>

type SegmentedProps = Readonly<{
  // Name der Auswahl für Screenreader, z. B. „Zeitraum“
  legend: string
  name: string
  options: readonly SegmentOption[]
  defaultValue?: string
  // Gesteuert: Die Auswahl folgt diesem Wert statt `defaultValue`
  value?: string | undefined
  onChange?: (value: string) => void
  // In Formularen steht der Name sichtbar darüber wie bei einem Feld
  isLegendVisible?: boolean
}>

// Segment-Steuerung für 2–4 Werte. Echte Radio-Knöpfe, damit Pfeiltasten und Formulare ohne JS gehen.
// Die Trefferfläche ist mindestens 44 px hoch (touch-target), auch wenn das Segment schmaler wirkt.
// Eine Radiogruppe mit Namen statt fieldset, damit Screenreader „Auswahl“ und den Namen ansagen.
export function Segmented({
  legend,
  name,
  options,
  defaultValue,
  value,
  onChange,
  isLegendVisible = false,
}: SegmentedProps) {
  const checkedProp = (optionValue: string) =>
    value === undefined
      ? { defaultChecked: optionValue === defaultValue }
      : { checked: optionValue === value }
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onChange?.(event.target.value)
  const legendId = useId()
  return (
    <div role="radiogroup" aria-labelledby={legendId}>
      <span
        id={legendId}
        className={isLegendVisible ? 'block px-4 pb-1.5 text-footnote text-fg2' : 'sr-only'}
      >
        {legend}
      </span>
      <div className="flex rounded-segment bg-fill p-0.5">
        {options.map((option) => (
          <label key={option.value} className="relative flex min-h-10 flex-1">
            <input
              type="radio"
              name={name}
              value={option.value}
              {...checkedProp(option.value)}
              onChange={handleChange}
              className="peer sr-only"
            />
            <span className="touch-target flex flex-1 cursor-pointer items-center justify-center rounded-thumb px-2 text-center text-footnote font-medium transition-colors duration-150 ease-out peer-checked:bg-surface peer-checked:font-semibold peer-checked:shadow-thumb peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-accent">
              {option.label}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
