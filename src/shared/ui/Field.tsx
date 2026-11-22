import { useId, type ComponentProps } from 'react'
import { cx } from '@/shared/lib/class-names'

type FieldProps = Omit<ComponentProps<'input'>, 'id' | 'className'> &
  Readonly<{
    label: string
    hint?: string | undefined
    // Fehler steht am Feld, nie nur oben im Formular
    error?: string | undefined
  }>

function describedBy(ids: readonly (string | false)[]): string | undefined {
  const present = ids.filter((id): id is string => id !== false)
  return present.length > 0 ? present.join(' ') : undefined
}

export function Field({ label, hint, error, ...inputProps }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hinweis`
  const errorId = `${id}-fehler`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="px-4 text-footnote text-fg2">
        {label}
      </label>
      <input
        {...inputProps}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy([
          hint !== undefined && hintId,
          error !== undefined && errorId,
        ])}
        className={cx(
          'min-h-11 w-full rounded-field border bg-surface px-4 text-body text-fg placeholder:text-fg2',
          error ? 'border-red' : 'border-line-strong',
        )}
      />
      {hint ? (
        <p id={hintId} className="px-4 text-footnote text-fg2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="px-4 text-footnote text-red">
          {error}
        </p>
      ) : null}
    </div>
  )
}
