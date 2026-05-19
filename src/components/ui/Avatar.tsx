import type { Member } from '../../types/app'

interface AvatarProps {
  member: Member
  size?: number
  ring?: boolean
}

export function Avatar({ member, size = 28, ring = false }: AvatarProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium ${member.color} ${ring ? 'ring-2 ring-white' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={member.name}
    >
      {member.avatar}
    </div>
  )
}
