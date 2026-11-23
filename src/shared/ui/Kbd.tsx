type KbdProps = Readonly<{ children: string }>

// Sichtbares Tastenkürzel ab „weit“ (DESIGN_SYSTEM §6). Für Screenreader steht das Kürzel im
// `aria-keyshortcuts` des Elements, deshalb ist die Taste selbst stumm. Farbe wie der Text daneben.
export function Kbd({ children }: KbdProps) {
  return (
    <kbd
      aria-hidden
      className="hidden h-5 min-w-5 place-items-center rounded-[5px] border border-current/50 px-1 font-sans text-caption uppercase weit:inline-grid"
    >
      {children}
    </kbd>
  )
}
