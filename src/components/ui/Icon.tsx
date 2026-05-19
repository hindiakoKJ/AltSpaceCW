import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface IconProps {
  name: string
  size?: number
  strokeWidth?: number
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 18, strokeWidth = 1.75, className = '', style }: IconProps) {
  const IconComp = (LucideIcons as unknown as Record<string, LucideIcon>)[name]
  if (!IconComp) {
    return <span className={`inline-block ${className}`} style={{ width: size, height: size, ...style }} />
  }
  return <IconComp size={size} strokeWidth={strokeWidth} className={className} style={style} />
}
