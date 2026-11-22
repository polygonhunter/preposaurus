import { ICON_PATHS, type IconName } from './icon-paths'

type IconProps = Readonly<{
  name: IconName
  size?: number
  className?: string
  // Nur setzen, wenn das Piktogramm allein steht. Neben einem Wort bleibt es stumm.
  label?: string
}>

export function Icon({ name, size = 24, className, label }: IconProps) {
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      focusable="false"
      {...a11y}
    >
      {ICON_PATHS[name]}
    </svg>
  )
}
