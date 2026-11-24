'use client'
import { useState, type ReactNode } from 'react'
import { createLeaveGuardRegistry, LeaveGuardContext } from './capture-leave'

type CaptureLeaveProviderProps = Readonly<{ children: ReactNode }>

// Verbindet „Abbrechen“ in der Kopfzeile mit dem Formular darunter (#285), eine Ablage je Erfassen.
export function CaptureLeaveProvider({ children }: CaptureLeaveProviderProps) {
  const [registry] = useState(createLeaveGuardRegistry)
  return <LeaveGuardContext value={registry}>{children}</LeaveGuardContext>
}
