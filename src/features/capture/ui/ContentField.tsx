import { Field } from '@/shared/ui/Field'
import { contentNoticeOf } from './content-notice'

type ContentFieldProps = Readonly<{
  value: string
  onChange: (text: string) => void
  // Beim Verlassen wählt das Erfassen ein passendes Produkt vor (#207)
  onLeave?: (text: string) => void
  error: string | undefined
}>

// „Inhalt je Packung“ in beiden Erfassen-Wegen und beim Bearbeiten. Eine unplausible Menge
// bekommt einen ruhigen Hinweis „bitte prüfen“, gespeichert werden darf trotzdem (#295).
export function ContentField({ value, onChange, onLeave, error }: ContentFieldProps) {
  return (
    <Field
      label="Inhalt je Packung"
      name="inhalt"
      autoComplete="off"
      placeholder="z. B. 500 g"
      hint="Mit Einheit: g, kg, ml oder l"
      value={value}
      onChange={(event) => {
        onChange(event.target.value)
      }}
      onBlur={(event) => onLeave?.(event.currentTarget.value)}
      error={error}
      notice={contentNoticeOf(value)}
    />
  )
}
