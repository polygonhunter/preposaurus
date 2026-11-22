import Link from 'next/link'
import type { IconName } from './icon-paths'
import { Icon } from './Icon'

type IconLinkProps = Readonly<{ href: string; icon: IconName; label: string }>

// Piktogramm als Link mit 44-px-Trefferfläche, z. B. das Zahnrad oben rechts.
export function IconLink({ href, icon, label }: IconLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full text-accent transition-opacity duration-150 ease-out active:opacity-60"
    >
      <Icon name={icon} />
    </Link>
  )
}
