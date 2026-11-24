'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { useReturnPath } from '@/shared/hooks/use-return-path'
import type { LeaveGuard } from './capture-leave'
import { CaptureLeaveSheet } from './CaptureLeaveSheet'
import { useLeaveIntercept } from './use-leave-intercept'

type LeaveAsk = Readonly<{ guard: LeaveGuard; href: string }>

// „Abbrechen“ oben links (UX_KONZEPT §6, #285): zurück auf die letzte Seite im App-Rahmen, ohne
// gemerkte Seite zur Übersicht. Ein Link, damit Next.js das Ziel vorlädt. Gibt es ungespeicherte
// Eingaben oder einen Foto-Entwurf, fragt erst das Blatt, bei „Abbrechen“ wie bei jedem anderen
// Link hinaus, etwa in der Seitenleiste ab „breit“ (useLeaveIntercept).
export function CaptureCancel() {
  const returnPath = useReturnPath()
  const router = useRouter()
  const [asked, setAsked] = useState<LeaveAsk | null>(null)
  const ask = useCallback((guard: LeaveGuard, href: string) => {
    setAsked({ guard, href })
  }, [])
  useLeaveIntercept(ask)

  return (
    <>
      <Link
        href={returnPath}
        className="touch-target flex items-center rounded-md px-2 text-accent breit:px-4"
      >
        Abbrechen
      </Link>
      <CaptureLeaveSheet
        guard={asked?.guard ?? null}
        onStay={() => {
          setAsked(null)
        }}
        onLeave={() => {
          if (asked !== null) router.push(asked.href)
        }}
      />
    </>
  )
}
