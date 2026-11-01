import type { TypeMeta } from '../types/app'

export const TYPE_META: Record<string, TypeMeta> = {
  hot:       { label: 'Hot Desk',        plural: 'Hot Desks',        accent: 'amber',   icon: 'Coffee' },
  dedicated: { label: 'Dedicated Desk',  plural: 'Dedicated Desks',  accent: 'emerald', icon: 'Monitor' },
  room:      { label: 'Conference Room', plural: 'Conference Rooms', accent: 'slate',   icon: 'Users' },
}
