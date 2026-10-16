import type { ReactNode } from 'react'

export function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        selected ? 'border-gold bg-gold text-ink' : 'border-line bg-white text-ink hover:bg-paper'
      }`}
    >
      {children}
    </button>
  )
}
