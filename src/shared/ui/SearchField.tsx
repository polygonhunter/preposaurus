'use client'

import type { ComponentProps } from 'react'
import { useShortcutKey } from '../hooks/use-shortcut-key'
import type { ShortcutAction } from '../lib/keyboard-shortcuts'
import { Icon } from './Icon'
import { Kbd } from './Kbd'

type SearchFieldProps = Omit<ComponentProps<'input'>, 'type' | 'className'> &
  Readonly<{
    // Unsichtbares Label für Screenreader; sichtbar ist nur der Platzhalter
    label: string
    // Tastenkürzel, das in dieses Feld springt (KeyboardShortcuts), ab „weit“ als `kbd` sichtbar.
    // Sind die Kürzel aus (#254), fehlen `kbd` und `aria-keyshortcuts`.
    shortcut?: ShortcutAction
  }>

export function SearchField({
  label,
  placeholder = 'Suchen',
  shortcut,
  ...rest
}: SearchFieldProps) {
  const shortcutKey = useShortcutKey(shortcut ?? 'search')
  const key = shortcut === undefined ? undefined : shortcutKey
  return (
    <label className="flex min-h-11 items-center">
      <span className="sr-only">{label}</span>
      <span className="flex h-9 w-full items-center gap-1.5 rounded-field bg-fill px-2 text-fg2 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
        <Icon name="search" size={20} />
        <input
          {...rest}
          type="search"
          placeholder={placeholder}
          aria-keyshortcuts={key}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-fg outline-none placeholder:text-fg2"
        />
        {key === undefined ? null : <Kbd>{key}</Kbd>}
      </span>
    </label>
  )
}
