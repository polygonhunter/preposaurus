import type { ReactNode } from 'react'
import { AppFrame } from '../_frame/AppFrame'

type AppLayoutProps = Readonly<{ children: ReactNode }>

// Alle Bereiche im App-Rahmen mit Tab-Leiste bzw. Seitenleiste (AppFrame). Erfassen hat ein
// eigenes Layout ohne Tab-Leiste: src/app/(erfassen)/layout.tsx.
export default function AppLayout({ children }: AppLayoutProps) {
  return <AppFrame>{children}</AppFrame>
}
