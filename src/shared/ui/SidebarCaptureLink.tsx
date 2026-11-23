import Link from 'next/link'
import { SHORTCUT_KEYS } from '@/shared/lib/keyboard-shortcuts'
import { Icon } from './Icon'
import { Kbd } from './Kbd'
import { CAPTURE_NAV } from './nav-items'

type SidebarCaptureLinkProps = Readonly<{ isCurrent: boolean }>

// „Erfassen“ als Knopf oben in der Seitenleiste (UX_KONZEPT §6): eine Handlung, kein Bereich.
// Ab „weit“ steht das Kürzel „n“ dabei.
export function SidebarCaptureLink({ isCurrent }: SidebarCaptureLinkProps) {
  return (
    <Link
      href={CAPTURE_NAV.href}
      aria-current={isCurrent ? 'page' : undefined}
      aria-keyshortcuts={SHORTCUT_KEYS.capture}
      className="flex min-h-11 items-center gap-2.5 rounded-button bg-accent px-2.5 text-headline text-on-accent transition-opacity duration-150 ease-out active:opacity-60"
    >
      <Icon name={CAPTURE_NAV.icon} size={22} />
      <span className="flex-1">{CAPTURE_NAV.label}</span>
      <Kbd>{SHORTCUT_KEYS.capture}</Kbd>
    </Link>
  )
}
