import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface PillProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  count?: number
  icon?: string
}

export function Pill({ active, onClick, children, count, icon }: PillProps) {
  return (
    <button
      onClick={onClick}
      className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all ${
        active
          ? 'border-slate-900 bg-slate-900 text-white shadow-soft'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
      }`}
    >
      {icon && <Icon name={icon} size={15} />}
      <span className="font-medium">{children}</span>
      {typeof count === 'number' && (
        <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
          active ? 'bg-white/15 text-white' : 'bg-stone-100 text-slate-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  )
}
