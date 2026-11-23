import type { ReactNode } from 'react'
import { ClearOfflinePages } from '@/shared/ui/ClearOfflinePages'
import { StandalonePage } from '@/shared/ui/StandalonePage'

type AuthLayoutProps = Readonly<{ children: ReactNode }>

// Anmelden und Einrichten: ohne Tab-Leiste und Seitenleiste, eine schmale Spalte wie ein Formular.
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <StandalonePage>
      {children}
      <ClearOfflinePages />
    </StandalonePage>
  )
}
