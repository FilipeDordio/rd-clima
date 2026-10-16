type IconProps = {
  className?: string
}

const defaultProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconSun({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
    </svg>
  )
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v3.2M16 3v3.2" />
    </svg>
  )
}

export function IconWrench({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M14.7 6.3a3.6 3.6 0 0 0-4.9 4.6L4.5 16.2a1.8 1.8 0 0 0 2.5 2.5l5.3-5.3a3.6 3.6 0 0 0 4.6-4.9l-2.6 2.6-2-2 2.6-2.6Z" />
    </svg>
  )
}

export function IconHardHat({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M4 17a8 8 0 0 1 16 0" />
      <path d="M3 17h18M12 9V6M12 6c2.8 0 5 2.6 5 6v1H7v-1c0-3.4 2.2-6 5-6Z" />
    </svg>
  )
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.5-3 2.7-5 5.5-5s5 2 5.5 5" />
      <path d="M15.5 6.2a2.7 2.7 0 0 1 0 5.2M17.5 19c-.3-2.2-1.4-3.9-2.9-4.7" />
    </svg>
  )
}

export function IconUser({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M4.8 19c.7-3.6 3.3-6 7.2-6s6.5 2.4 7.2 6" />
    </svg>
  )
}

export function IconMapPin({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M12 21.5s-6.5-5.8-6.5-11A6.5 6.5 0 0 1 18.5 10.5c0 5.2-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  )
}

export function IconMenu({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function IconLogOut({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export function IconWhatsApp({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M4 20l1.1-4.3A8 8 0 1 1 8.3 18.9 8 8 0 0 1 4 20Z" />
      <path d="M8.7 8.6c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .5.4.2.5.6 1.5.6 1.6.1.1.1.3 0 .4-.1.2-.1.3-.3.4-.1.2-.3.3-.4.5-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.5 1.5.3.1.5.1.6-.1.2-.2.7-.8.9-1 .2-.2.3-.2.6-.1l1.5.7c.2.1.4.2.4.3.1.2.1.9-.2 1.4-.3.6-1.5 1.1-2 1.1-.6.1-1.1.1-2.5-.5-2.1-.9-3.5-2.9-3.6-3.1-.1-.1-.9-1.2-.9-2.3 0-1.1.6-1.7.8-1.9Z" />
    </svg>
  )
}

export function IconMail({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  )
}

export function IconChartBar({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M5 20V11M12 20V4M19 20v-6" />
      <path d="M3 20h18" />
    </svg>
  )
}

export function IconMaintenance({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v5h-5" />
    </svg>
  )
}

export function IconAlertTriangle({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.5h.01" />
    </svg>
  )
}

export function IconSettings({ className }: IconProps) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="12" cy="12" r="2.8" />
      <path d="M19.4 14.5a1.5 1.5 0 0 0 .3 1.65l.05.05a1.8 1.8 0 1 1-2.55 2.55l-.05-.05a1.5 1.5 0 0 0-1.65-.3 1.5 1.5 0 0 0-.9 1.37V20a1.8 1.8 0 0 1-3.6 0v-.08a1.5 1.5 0 0 0-.98-1.38 1.5 1.5 0 0 0-1.65.3l-.05.05a1.8 1.8 0 1 1-2.55-2.55l.05-.05a1.5 1.5 0 0 0 .3-1.65 1.5 1.5 0 0 0-1.37-.9H4a1.8 1.8 0 0 1 0-3.6h.08a1.5 1.5 0 0 0 1.38-.98 1.5 1.5 0 0 0-.3-1.65l-.05-.05a1.8 1.8 0 1 1 2.55-2.55l.05.05a1.5 1.5 0 0 0 1.65.3H9.5a1.5 1.5 0 0 0 .9-1.37V4a1.8 1.8 0 0 1 3.6 0v.08a1.5 1.5 0 0 0 .9 1.37 1.5 1.5 0 0 0 1.65-.3l.05-.05a1.8 1.8 0 1 1 2.55 2.55l-.05.05a1.5 1.5 0 0 0-.3 1.65V9.5a1.5 1.5 0 0 0 1.37.9H20a1.8 1.8 0 0 1 0 3.6h-.08a1.5 1.5 0 0 0-1.37.9Z" />
    </svg>
  )
}
