type RadioOption = Readonly<{ id: string; name: string }>

type RadioListProps = Readonly<{
  legend: string
  name: string
  options: readonly RadioOption[]
  // Gewählte ID, ohne Angabe „Alle“
  value?: string | undefined
}>

const ALL = ''

// Auswahl als gruppierte Liste mit Haken statt Dropdown (UX-Konzept P8). Echte Radio-Knöpfe,
// damit Tastatur, Screenreader und Formular ohne Zusatzcode funktionieren. „Alle“ sendet einen
// leeren Wert, die Adresse lässt ihn weg.
export function RadioList({ legend, name, options, value }: RadioListProps) {
  const choices = [{ id: ALL, name: 'Alle' }, ...options]
  return (
    <fieldset>
      <legend className="pb-1.5 text-footnote tracking-wide text-fg2 uppercase">{legend}</legend>
      <div className="overflow-hidden rounded-group border border-line">
        {choices.map((choice) => (
          <label
            key={choice.id}
            className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 not-first:border-t not-first:border-line has-focus-visible:outline-2 has-focus-visible:-outline-offset-2 has-focus-visible:outline-accent"
          >
            <span>{choice.name}</span>
            <input
              type="radio"
              name={name}
              value={choice.id}
              defaultChecked={choice.id === (value ?? ALL)}
              className="size-5 accent-accent"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
