import type { ReactNode } from 'react'

type AuthLayoutProps = Readonly<{ children: ReactNode }>

// Anmelden und Einrichten: ohne Tab-Leiste und Seitenleiste, eine schmale Spalte wie ein Formular.
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-[480px] pr-[env(safe-area-inset-right)] pb-[calc(24px+env(safe-area-inset-bottom))] pl-[env(safe-area-inset-left)] breit:pt-12">
      {children}
    </main>
  )
}
