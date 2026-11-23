import type { ReactNode } from 'react'

type StandalonePageProps = Readonly<{ children: ReactNode }>

// Seite ohne Tab-Leiste und Seitenleiste, eine schmale Spalte: Anmelden, Einrichten und die
// Fehlerseiten (nicht gefunden, Fehler), die außerhalb des App-Rahmens liegen.
export function StandalonePage({ children }: StandalonePageProps) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] pr-[env(safe-area-inset-right)] pb-[calc(24px+env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] breit:pt-12">
      {children}
    </main>
  )
}
