// Jeder Weg aus dem Erfassen fragt wie „Abbrechen“ (#285): Ab „breit“ steht die Seitenleiste daneben,
// ein Klick dort ließe sonst ungespeicherte Eingaben still zurück. Abgefangen wird in der
// Capture-Phase am document, also bevor next/link navigiert. Neu laden oder den Tab schließen fragt
// der Browser selbst, aber nur, wenn Eingaben allein auf dem Gerät liegen.
import { useEffect } from 'react'
import { isActivePath } from '@/shared/lib/paths'
import { CAPTURE_NAV } from '@/shared/ui/nav-items'
import { useLeaveGuardRegistry, type LeaveGuard } from './capture-leave'

type LeaveRequest = (guard: LeaveGuard, href: string) => void

const isPlainClick = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

/** Ziel eines Links, der das Erfassen in diesem Tab verlässt, sonst null. */
function leavingHref(event: MouseEvent): string | null {
  if (event.defaultPrevented || !isPlainClick(event)) return null
  const link = event.target instanceof Element ? event.target.closest('a[href]') : null
  if (!(link instanceof HTMLAnchorElement) || link.target !== '' || link.hasAttribute('download'))
    return null
  const url = new URL(link.href)
  if (url.origin !== window.location.origin || isActivePath(url.pathname, CAPTURE_NAV.href))
    return null
  return `${url.pathname}${url.search}${url.hash}`
}

export function useLeaveIntercept(onLeaveRequest: LeaveRequest): void {
  const registry = useLeaveGuardRegistry()
  useEffect(() => {
    function interceptLink(event: MouseEvent) {
      const href = leavingHref(event)
      const guard = registry.read()
      if (href === null || guard.kind === 'none') return
      event.preventDefault()
      onLeaveRequest(guard, href)
    }
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (registry.read().kind === 'unsaved') event.preventDefault()
    }
    document.addEventListener('click', interceptLink, true)
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => {
      document.removeEventListener('click', interceptLink, true)
      window.removeEventListener('beforeunload', warnBeforeUnload)
    }
  }, [registry, onLeaveRequest])
}
