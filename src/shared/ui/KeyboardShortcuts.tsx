'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { SHORTCUT_KEYS, shortcutFor } from '@/shared/lib/keyboard-shortcuts'
import { CAPTURE_NAV, SEARCH_HREF } from './nav-items'

// Das Suchfeld trägt sein Kürzel in aria-keyshortcuts (SearchField), so findet es sich ohne ID.
const SEARCH_SELECTOR = `input[aria-keyshortcuts="${SHORTCUT_KEYS.search}"]`
// So lange wartet „/“ nach dem Wechsel in den Vorrat auf das Suchfeld
const SEARCH_WAIT_MS = 5000

function findSearchField(): HTMLInputElement | null {
  return document.querySelector<HTMLInputElement>(SEARCH_SELECTOR)
}

function focusField(field: HTMLInputElement): void {
  field.focus()
  field.select()
}

/** Fokussiert das Suchfeld, sobald die neue Seite es zeigt. */
function focusSearchWhenShown(): void {
  const observer = new MutationObserver(() => {
    const field = findSearchField()
    if (field === null) return
    observer.disconnect()
    focusField(field)
  })
  observer.observe(document.body, { childList: true, subtree: true })
  window.setTimeout(() => {
    observer.disconnect()
  }, SEARCH_WAIT_MS)
}

const hasOpenDialog = () => document.querySelector('dialog[open]') !== null

const targetOf = (event: KeyboardEvent) =>
  event.target instanceof HTMLElement ? event.target : null

// Globale Tastenkürzel (DESIGN_SYSTEM §6): „/“ Suche im Vorrat, „n“ Erfassen. Nicht in
// Eingabefeldern und nicht, solange ein Blatt offen ist. Sichtbar sind sie ab „weit“ als `kbd`.
export function KeyboardShortcuts() {
  const router = useRouter()
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const action = shortcutFor(event, targetOf(event))
      if (action === null || hasOpenDialog()) return
      event.preventDefault()
      if (action === 'capture') {
        router.push(CAPTURE_NAV.href)
        return
      }
      const field = findSearchField()
      if (field !== null) {
        focusField(field)
        return
      }
      focusSearchWhenShown()
      router.push(SEARCH_HREF)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [router])
  return null
}
