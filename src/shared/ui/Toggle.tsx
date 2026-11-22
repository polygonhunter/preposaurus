import type { ComponentProps } from 'react'

type ToggleProps = Omit<ComponentProps<'input'>, 'type' | 'role' | 'className'> &
  Readonly<{ label: string }>

// Schalter wie iOS: echte Checkbox mit role="switch", Grün für „an“.
export function Toggle({ label, ...inputProps }: ToggleProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
      <span className="text-body">{label}</span>
      <input {...inputProps} type="checkbox" role="switch" className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-[31px] w-[51px] shrink-0 rounded-full bg-fill transition-colors duration-200 ease-out peer-checked:bg-green peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent peer-disabled:opacity-40 after:absolute after:top-0.5 after:left-0.5 after:size-[27px] after:rounded-full after:bg-surface after:shadow-thumb after:transition-transform after:duration-200 after:ease-out peer-checked:after:translate-x-5"
      />
    </label>
  )
}
