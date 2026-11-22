type SkipLinkProps = Readonly<{ targetId: string }>

// Erster Tab-Halt jeder Seite: springt an der Navigation vorbei zum Inhalt.
export function SkipLink({ targetId }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-button bg-accent px-4 py-3 text-headline text-on-accent focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-30"
    >
      Zum Inhalt springen
    </a>
  )
}
