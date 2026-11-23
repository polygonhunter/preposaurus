// Gemeinsame Klassen für Button und ButtonLink, damit Knopf und Link gleich aussehen.
import { cx } from '@/shared/lib/class-names'

export const BUTTON_VARIANTS = ['primary', 'tinted', 'plain', 'destructive'] as const
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number]

const BASE =
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-opacity duration-150 ease-out active:opacity-60 disabled:cursor-not-allowed disabled:opacity-40 aria-disabled:cursor-not-allowed aria-disabled:opacity-40'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'h-[50px] w-full rounded-button bg-accent px-4 text-headline text-on-accent',
  tinted: 'touch-target rounded-full bg-fill px-3.5 py-1.5 text-callout font-semibold text-accent',
  plain: 'min-h-11 px-1 text-body text-accent',
  destructive: 'min-h-11 px-1 text-body text-red',
}

export function buttonClasses(variant: ButtonVariant, className?: string): string {
  return cx(BASE, VARIANT_CLASSES[variant], className)
}
