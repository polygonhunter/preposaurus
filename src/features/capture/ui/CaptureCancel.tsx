'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useReturnPath } from '@/shared/hooks/use-return-path'
import { useLeaveGuardRegistry, type LeaveGuard } from './capture-leave'
import { CaptureLeaveSheet } from './CaptureLeaveSheet'

// „Abbrechen“ oben links (UX_KONZEPT §6, #285): zurück auf die letzte Seite im App-Rahmen, ohne
// gemerkte Seite zur Übersicht. Ein Link, damit Next.js das Ziel vorlädt. Gibt es ungespeicherte
// Eingaben oder einen Foto-Entwurf, fragt erst das Blatt.
export function CaptureCancel() {
  const registry = useLeaveGuardRegistry()
  const returnPath = useReturnPath()
  const router = useRouter()
  const [asked, setAsked] = useState<LeaveGuard | null>(null)

  return (
    <>
      <Link
        href={returnPath}
        className="touch-target flex items-center rounded-md px-2 text-accent breit:px-4"
        onClick={(event) => {
          const guard = registry.read()
          if (guard.kind === 'none') return
          event.preventDefault()
          setAsked(guard)
        }}
      >
        Abbrechen
      </Link>
      <CaptureLeaveSheet
        guard={asked}
        onStay={() => {
          setAsked(null)
        }}
        onLeave={() => {
          router.push(returnPath)
        }}
      />
    </>
  )
}
